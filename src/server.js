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
// ✅ chat endpoint (now uses per-client FAQ)
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

    // 1) get client from object-style config (your current setup)
    const client = !Array.isArray(clientConfigs)
      ? clientConfigs[clientId] ||
        clientConfigs['demo-gym'] || // fallback
        {}
      : clientConfigs.find((c) => c.id === clientId) ||
        clientConfigs[0] ||
        {};

    // 2) try to load that client's FAQ file
    let faqPairs = [];
    if (client.faqFile) {
      const faqPath = path.join(__dirname, client.faqFile);
      if (fs.existsSync(faqPath)) {
        const rawFaq = fs.readFileSync(faqPath, 'utf-8');
        faqPairs = JSON.parse(rawFaq);
      }
    }

    // 3) turn FAQ into text the model can use
    const faqText = faqPairs
      .map((item) => `Q: ${item.q}\nA: ${item.a}`)
      .join('\n\n');

    // 4) build a stricter system prompt so it doesn't make stuff up
    const systemPrompt = `
You are the FAQ assistant for ${client.name || 'this business'}.
Answer using ONLY the FAQ entries provided below.
If the user asks something that is not covered, say: "${client.fallbackMessage || "I'm not sure about that yet."}"

FAQ:
${faqText || 'No FAQ data was provided.'}
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
        "I couldn't find that in the FAQ. Please contact the business.",
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
