import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(express.json());
app.use(express.static('public', {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    console.log('Received message:', message);
    console.log('Conversation history length:', conversationHistory.length);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build messages array with conversation history
    const input = [
      {
        role: 'system',
        content: 'You are a helpful FAQ assistant for a website. Answer user questions clearly, concisely, and professionally. If you don\'t know the answer, politely say so and offer to help with something else.'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const response = await openai.responses.create({
      model: 'gpt-5',
      input: input,
      reasoning: { effort: 'low' },
      max_output_tokens: 5000,
    });

    const assistantMessage = response.output_text || '';
    
    console.log('Sending response:', assistantMessage);
    console.log('Full response object:', JSON.stringify(response));

    if (!assistantMessage || assistantMessage.trim() === '') {
      return res.json({
        response: 'I apologize, but I was unable to generate a response. Please try asking your question again.',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      response: assistantMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FAQ Bot server running on http://0.0.0.0:${port}`);
});
