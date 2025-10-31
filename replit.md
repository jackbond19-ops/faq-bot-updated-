# FAQ Bot for Website

## Overview
A modern, AI-powered FAQ chatbot for websites that uses OpenAI's GPT-5 API to provide intelligent, conversational responses to user questions. The bot maintains conversation context and provides a clean, user-friendly interface.

## Project Architecture

### Technology Stack
- **Backend**: Node.js with Express.js
- **AI Integration**: OpenAI API (GPT-5 model)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Modern gradient design with responsive layout

### File Structure
```
/
├── server.js           # Express server with OpenAI API integration
├── package.json        # Node.js dependencies and scripts
├── public/
│   ├── index.html     # Main chat interface
│   ├── styles.css     # Modern UI styling
│   └── script.js      # Client-side chat logic
└── replit.md          # Project documentation
```

## Features
- Real-time chat interface with typing indicators
- Conversation history maintained across messages
- Beautiful gradient UI design
- Responsive layout (mobile-friendly)
- Error handling for API failures
- Smooth animations and transitions

## API Endpoints
- `GET /` - Serves the main chat interface
- `POST /api/chat` - Processes user messages and returns AI responses
  - Body: `{ message: string, conversationHistory: array }`
  - Response: `{ response: string, timestamp: string }`

## Configuration
- Server runs on port 5000
- Binds to 0.0.0.0 for accessibility
- Uses OPENAI_API_KEY environment variable for authentication

## Recent Changes
- 2025-10-31: Initial project setup with OpenAI GPT-5 integration
- 2025-10-31: Created responsive chat UI with modern gradient design
- 2025-10-31: Implemented conversation history for context-aware responses

## User Preferences
None documented yet.
