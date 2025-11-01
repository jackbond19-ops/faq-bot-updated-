// open/close widget
const launcher = document.getElementById("chat-launcher");
const widget = document.getElementById("chat-widget");
const closeBtn = document.getElementById("chat-close");

launcher.addEventListener("click", () => {
  widget.classList.remove("hidden");
  launcher.style.display = "none"; // hide button when open
});

closeBtn.addEventListener("click", () => {
  widget.classList.add("hidden");
  launcher.style.display = "block";
});
// chat functionality
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

let conversationHistory = [];

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

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversationHistory: conversationHistory
            }),
        });
        
        const data = await response.json();
        
        console.log('Received data:', data);
        console.log('Response text:', data.response);
        
        removeTypingIndicator();
        
        if (response.ok) {
            if (data.response) {
                addMessage(data.response, false);
                conversationHistory.push({ role: 'user', content: message });
                conversationHistory.push({ role: 'assistant', content: data.response });
            } else {
                console.error('No response text received');
                addMessage('Error: No response received from bot', false);
            }
        } else {
            addMessage(`Error: ${data.error || 'Something went wrong'}`, false);
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage('Error: Unable to connect to the server. Please try again.', false);
        console.error('Error:', error);
    } finally {
        sendButton.disabled = false;
        userInput.focus();
    }
}

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

userInput.focus();
