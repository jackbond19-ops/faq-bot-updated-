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

// 🆕 Serve the demo UI (public folder)
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

  if (!Array.isArray(clientConfigs)) {
    const client = clientConfigs[clientId];
    if (!client) {
      return res.status(404).json({ error: `Client not found: ${clientId}` });
    }
    return res.json(client);
  }

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

// ✅ chat endpoint (per-client FAQ)
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

    const client = !Array.isArray(clientConfigs)
      ? clientConfigs[clientId] ||
        clientConfigs['demo-gym'] ||
        {}
      : clientConfigs.find((c) => c.id === clientId) ||
        clientConfigs[0] ||
        {};

    // load FAQ
    let faqPairs = [];
    if (client.faqFile) {
      const faqPath = path.join(__dirname, client.faqFile);
      if (fs.existsSync(faqPath)) {
        const rawFaq = fs.readFileSync(faqPath, 'utf-8');
        faqPairs = JSON.parse(rawFaq);
      } else {
        console.warn('⚠️ FAQ file not found for', clientId, 'at', faqPath);
      }
    }

    // ✅ exact / simple match first (no AI needed)
    const lowerMsg = message.toLowerCase();
    const direct = faqPairs.find(
      (item) =>
        item.q.toLowerCase() === lowerMsg ||
        lowerMsg.includes(item.q.toLowerCase())
    );
    if (direct) {
      return res.json({
        response: direct.a,
        timestamp: new Date().toISOString(),
      });
    }

    // build FAQ text for AI
    const faqText = faqPairs
      .map((item) => `Q: ${item.q}\nA: ${item.a}`)
      .join('\n\n');

    const systemPrompt = `
You are the FAQ assistant for ${client.name || 'this business'}.
Use ONLY the information in the FAQ below to answer.
If the answer is not in the FAQ, say: "${client.fallbackMessage || "I'm not sure about that yet."}"

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

// 🆕 Simple demo chat route for your web demo
app.post('/chat', async (req, res) => {
  // internally call your /api/chat endpoint logic (reuse it)
  const result = await fetch(`http://localhost:${port}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: req.body.message, clientId: 'demo-gym' }),
  });
  const data = await result.json();
  res.json({ answer: data.response });
});

// 🆕 Serve index.html directly for /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// start
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 FAQ Bot server running on http://localhost:${port}`);
});

