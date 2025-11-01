// ✅ Load environment variables FIRST
import 'dotenv/config';

// ✅ Debug check: confirm .env is being read
console.log('🧩 Checking .env:', process.env.OPENAI_API_KEY ? '✅ Found key' : '❌ Missing key');
console.log('👉 Actual value starts with:', process.env.OPENAI_API_KEY?.slice(0, 10) || 'undefined');

// ✅ Imports for debugging and server setup
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import OpenAI from 'openai';

// ✅ Show where the server is running from
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('👉 Running from:', __dirname);
console.log('👉 Files in this folder:', fs.readdirSync(__dirname));

// ✅ Express app setup
const app = express();
const port = process.env.PORT || 5000;

// ✅ Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Middleware
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
  console.log("Looking for:", path.join(__dirname, 'public', 'index.html'));
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    console.log('💬 Received message:', message);
    console.log('🗂️ Conversation history length:', conversationHistory.length);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build messages array with conversation history
    const input = [
      {
        role: 'system',
        content:
          "You are a helpful FAQ assistant for a website. Answer user questions clearly, concisely, and professionally. If you don't know the answer, politely say so and offer to help with something else.",
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    // ✅ Call OpenAI API
    const response = await openai.responses.create({
      model: 'gpt-4o-mini', // Replace with gpt-5 if available to your account
      input,
      max_output_tokens: 500,
    });

    const assistantMessage = response.output_text || '';
    console.log('🤖 Sending response:', assistantMessage);

    if (!assistantMessage || assistantMessage.trim() === '') {
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

// ✅ Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 FAQ Bot server running on http://localhost:${port}`);
});
