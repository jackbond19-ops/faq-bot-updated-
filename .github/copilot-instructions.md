# FAQ Bot AI Assistant Instructions

## Project Overview
This is a customizable FAQ chatbot that uses OpenAI's API to provide client-specific responses. The system consists of:
- Express.js backend (`server.js`)
- Static frontend (`public/`)
- Client configuration system (`client-config.json`)

## Key Architecture Points

### Client Configuration
- Clients are defined in `client-config.json` with properties:
  ```json
  {
    "id": "client-id",
    "name": "Business Name",
    "tone": "communication style",
    "openingMessage": "Initial greeting",
    "allowedTopics": ["array", "of", "allowed", "topics"],
    "fallbackMessage": "Response for out-of-scope questions"
  }
  ```

### Communication Flow
1. Frontend initiates with client ID (e.g., `demo-hair-salon`, `demo-gym`)
2. Backend loads client config and maintains conversation history
3. OpenAI API interactions are wrapped with client-specific system prompts

## Development Workflow

### Environment Setup
1. Create `.env` file with:
   ```
   OPENAI_API_KEY=your_key_here
   PORT=5000 (optional)
   ```
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

### Common Patterns
- Frontend message handling in `public/script.js` uses utility functions:
  - `addMessage()` for rendering messages
  - `showTypingIndicator()` / `removeTypingIndicator()` for loading states
- Backend error handling includes detailed logging and client-friendly responses

### Integration Points
- OpenAI API communication in `server.js`
- Client config endpoint: `GET /api/client-config?clientId=X`
- Chat endpoint: `POST /api/chat` with body:
  ```json
  {
    "message": "user input",
    "clientId": "client identifier",
    "conversationHistory": []
  }
  ```

## Key Files
- `server.js`: Main backend logic and API endpoints
- `public/script.js`: Frontend chat interface and API integration
- `client-config.json`: Client-specific settings and prompts
- `public/index.html`: Chat widget UI structure
- `public/styles.css`: Chat widget styling

## Security Considerations
- Always escape HTML in chat messages using `escapeHtml()` function
- Client configurations are read-only and server-side validated
- Cache-Control headers prevent response caching