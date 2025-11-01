// ✅ Load environment variables FIRST
import 'dotenv/config';

console.log(
  '🧩 Checking .env:',
  process.env.OPENAI_API_KEY ? '✅ Found key' : '❌ Missing key'
);
console.log(
  '👉 Actual value starts with:',
  process.env.OPENAI_API_KEY?.slice(0, 10) || 'undefined'
);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import OpenAI from 'openai';
import clientConfigs from './client-config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('👉 Running from:', __dirname);
console.log('👉 Files in this folder:', fs.readdirSync(__dirname));

const app = express();
const port = process.env.PORT || 5000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(
  express.static('public', {
    setHeaders: (res) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    },
  })
);

// ✅ Serve frontend
app.get('/', (req, res) => {
  console.log('Looking for:', path.join(__dirname, 'public', 'index.html'));
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ NEW: let frontend fetch the client's preferences
app.get('/api/client-config', (req, res) => {
  const clientId = req.query.clientId || 'demo-hair-salon';

  const client =
    clientConfigs.find((c) => c.id === clientId) || clientConfigs[0];

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  res.json({
    id: client.id,
    name: client.name,
    tone: client.tone,
    openingMessage:
      client.openingMessage ||
      client.fallbackMessage ||
      "Hello! I'm here to help answer your questions.",
    allowedTopics: client.allowedTopics || [],
  });
});

// ✅ Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      clientId = 'demo-hair-salon',
      conversationHistory = [],
    } = req.body;

    console.log('💬 Received message:', message);
    console.log('🗂️ Conversation history length:', conversationHistory.length);
    console.log('🏢 Client ID:', clientId);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const client =
      clientConfigs.find((c) => c.id === clientId) || clientConfigs[0];

    console.log('✅ Using client config for:', client?.name || 'UNKNOWN');

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
    console.log('🤖 Sending response:', assistantMessage);

    if (!assistantMessage.trim()) {
      return res.json({
        response:
          'I apologize, but I was unable to generate a response. Please try asking your question again.',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      response: assistantMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message,
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 FAQ Bot server running on http://localhost:${port}`);
});
