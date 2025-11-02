// ✅ Load environment variables FIRST
import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import OpenAI from 'openai';

// ✅ paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ load client configs
const clientConfigPath = path.join(__dirname, 'client-config.json');
const clientConfigs = JSON.parse(fs.readFileSync(clientConfigPath, 'utf-8'));

console.log(
  '🧩 Checking .env:',
  process.env.OPENAI_API_KEY ? '✅ Found key' : '❌ Missing key'
);
console.log('👉 Running from:', __dirname);
console.log('👉 Files in this folder:', fs.readdirSync(__dirname));

const app = express();
const port = process.env.PORT || 5000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// middleware
app.use(express.json());
app.use(
  express.static('public', {
    setHeaders: (res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    },
  })
);

// ✅ expose client settings
app.get('/api/client-config', (req, res) => {
  const clientId = req.query.clientId || 'demo-hair-salon';

  // object style (your current JSON)
  if (!Array.isArray(clientConfigs)) {
    const client = clientConfigs[clientId];

    if (!client) {
      return res.status(404).json({ error: `Client not found: ${clientId}` });
    }

    return res.json(client);
  }

  // fallback for array style
  const client =
    clientConfigs.find((c) => c.id === clientId) || clientConfigs[0];

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  return res.json(client);
});

// (optional helper route you already had)
app.get('/api/client-settings', (req, res) => {
  const clientId = req.query.clientId || 'demo-hair-salon';

  // support both shapes
  const client = !Array.isArray(clientConfigs)
    ? clientConfigs[clientId] || clientConfigs['demo-hair-salon']
    : clientConfigs.find((c) => c.id === clientId) || clientConfigs[0];

  res.json({
    id: clientId,
    name: client.name,
    tone: client.tone,
    openingMessage:
      client.openingMessage ||
      client.fallbackMessage ||
      "Hello! I'm here to help answer your questions.",
    allowedTopics: client.allowedTopics || [],
    suggestedQuestions: client.suggestedQuestions || [],
  });
});

// ✅ chat endpoint (FIXED)
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      clientId = 'demo-hair-salon',
      conversationHistory = [],
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 👇 FIX: read client by key if configs is an object
    const client = !Array.isArray(clientConfigs)
      ? clientConfigs[clientId] ||
        clientConfigs['demo-hair-salon'] ||
        {}
      : clientConfigs.find((c) => c.id === clientId) ||
        clientConfigs[0] ||
        {};

    const systemPrompt = `
You are the FAQ assistant for ${client.name || 'this business'}.
Speak in a ${client.tone || 'friendly'} tone.
If the user asks about something outside ${
      client.allowedTopics?.join(', ') || 'their services'
    }, say: "${client.fallbackMessage || "I'm not sure about that yet."}"
Keep answers clear and short.
    `.trim();

    const input = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input,
      max_output_tokens: 500,
    });

    const assistantMessage = response.output_text || '';

    res.json({
      response:
        assistantMessage.trim() ||
        'I could not generate a response. Please try again.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Error calling OpenAI API:', err);
    res.status(500).json({
      error: 'Failed to get response from AI',
      details: err.message,
    });
  }
});

// start
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 FAQ Bot server running on http://localhost:${port}`);
});
