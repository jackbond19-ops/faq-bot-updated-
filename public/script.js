// identify which company's chatbot this is
// (you can switch to demo-hair-salon or demo-gym)
const CLIENT_ID = 'demo-gym';

// open/close widget
const launcher = document.getElementById("chat-launcher");
const widget = document.getElementById("chat-widget");
const closeBtn = document.getElementById("chat-close");

if (launcher && widget && closeBtn) {
  launcher.addEventListener("click", () => {
    widget.classList.remove("hidden");
    launcher.style.display = "none";
  });

  closeBtn.addEventListener("click", () => {
    widget.classList.add("hidden");
    launcher.style.display = "block";
  });
}

// chat functionality
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

let conversationHistory = [];

// 🟢 helper to show messages in the chat
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.innerHTML = `<strong>${isUser ? 'You' : 'Bot'}:</strong> ${escapeHtml(content)}`;
  messageDiv.appendChild(messageContent);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 🟢 show a typing indicator while waiting for response
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message';
  typingDiv.id = 'typingIndicator';
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  typingDiv.appendChild(indicator);
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 🟢 remove typing indicator
function removeTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

// 🟢 escape text to prevent HTML injection
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 🟢 load greeting from backend (ONLY ONE FUNCTION)
async function loadClientGreeting() {
  const DEFAULT_GREETING =
    "Hello! I'm here to help answer your questions. How can I assist you today?";

  try {
    const res = await fetch(
      `/api/client-config?clientId=${encodeURIComponent(CLIENT_ID)}`
    );

    if (!res.ok) {
      throw new Error('Failed to load client config');
    }

    const data = await res.json();

    const opening = data.openingMessage || DEFAULT_GREETING;
    addMessage(opening, false);
  } catch (err) {
    console.error('Failed to load greeting:', err);
    addMessage(DEFAULT_GREETING, false);
  }
}

// 🟢 send user message to backend
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, true);
  userInput.value = '';
  sendButton.disabled = true;
  showTypingIndicator();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory,
        clientId: CLIENT_ID,
      }),
    });

    const data = await response.json();
    removeTypingIndicator();

    if (response.ok && data.response) {
      addMessage(data.response, false);
      conversationHistory.push({ role: 'user', content: message });
      conversationHistory.push({ role: 'assistant', content: data.response });
    } else {
      addMessage(`Error: ${data.error || 'Something went wrong'}`, false);
    }
  } catch (err) {
    removeTypingIndicator();
    addMessage('Error: Unable to connect to the server. Please try again.', false);
    console.error(err);
  } finally {
    sendButton.disabled = false;
    userInput.focus();
  }
}

// 🟢 add event listeners
if (sendButton) {
  sendButton.addEventListener('click', sendMessage);
}
if (userInput) {
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// 🟢 load the opening message right after setup
loadClientGreeting();
userInput?.focus();
