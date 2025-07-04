// DOM Elements
const chatMenu = document.getElementById('chatMenu');
const menuToggle = document.getElementById('menuToggle');
const chatArea = document.querySelector('.chat-area');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messages');
const typingAnimation = document.getElementById('typingAnimation');
const chatHistory = document.getElementById('chatHistory');
const newChatBtn = document.querySelector('.new-chat-btn');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const fileInput = document.getElementById('fileInput');
let isRecording = false;

// Initialize speech recognition with better cross-device support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // Add error handling for permission and device compatibility
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        switch (event.error) {
            case 'not-allowed':
                appendMessage('Microphone permission denied. Please enable microphone access in your browser settings.', false);
                break;
            case 'no-speech':
                appendMessage('No speech was detected. Please try again and speak clearly.', false);
                break;
            case 'network':
                appendMessage('Network error occurred. Please check your connection and try again.', false);
                break;
            case 'aborted':
                appendMessage('Speech recognition was aborted. Please try again.', false);
                break;
            case 'audio-capture':
                appendMessage('No microphone was found. Please ensure your device has a working microphone.', false);
                break;
            case 'service-not-allowed':
                appendMessage('Speech recognition service is not allowed. Please try again later.', false);
                break;
            default:
                appendMessage('An error occurred with speech recognition. Please try again.', false);
        }
        voiceInputBtn.classList.remove('recording');
        isRecording = false;
    };

    recognition.onend = () => {
        voiceInputBtn.classList.remove('recording');
        isRecording = false;
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        messageInput.style.height = messageInput.scrollHeight + 'px';
        // Remove the listening message when voice input is received
        const lastMessage = messagesContainer.lastElementChild;
        if (lastMessage && lastMessage.innerHTML.includes('Listening to your voice')) {
            messagesContainer.removeChild(lastMessage);
        }
    };

    // Improved voice input handling with better mobile support
    voiceInputBtn.addEventListener('click', async () => {
        try {
            if (!isRecording) {
                // Request microphone permission explicitly
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
                
                recognition.start();
                voiceInputBtn.classList.add('recording');
                isRecording = true;
                const listeningMessage = document.createElement('div');
                listeningMessage.className = 'message bot';
                listeningMessage.innerHTML = '<i class="fas fa-microphone"></i> Listening to your voice...';
                messagesContainer.appendChild(listeningMessage);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                // Add vibration feedback for mobile devices if supported
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            } else {
                recognition.stop();
                voiceInputBtn.classList.remove('recording');
                isRecording = false;
                // Remove the last message if it's the listening message
                const lastMessage = messagesContainer.lastElementChild;
                if (lastMessage && lastMessage.innerHTML.includes('Listening to your voice')) {
                    messagesContainer.removeChild(lastMessage);
                }
                
                // Add vibration feedback for mobile devices if supported
                if (navigator.vibrate) {
                    navigator.vibrate([30, 30, 30]);
                }
            }
        } catch (error) {
            console.error('Microphone permission error:', error);
            appendMessage('Microphone access is required for voice input. Please enable it in your browser settings and ensure your device has a working microphone.', false);
            voiceInputBtn.classList.remove('recording');
            isRecording = false;
        }
    });
    
    // Add touch event listeners for better mobile experience
    voiceInputBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent default touch behavior
        this.classList.add('active');
    });
    
    voiceInputBtn.addEventListener('touchend', function() {
        this.classList.remove('active');
    });
    
} else {
    voiceInputBtn.style.display = 'none';
    console.log('Speech recognition not supported on this browser');
    appendMessage('Voice input is not supported on your browser. Please use a modern browser like Chrome, Safari, or Edge.', false);
}

// Constants
const OPENROUTER_API_KEY = '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';
const MODEL = 'mistralai/mistral-7b-instruct:free';

// State
let currentChatId = null;
let chats = JSON.parse(localStorage.getItem('chats')) || {};

// Initialize chat history
updateChatHistory();

// Event Listeners
// Improved menu toggle functionality with touch support
menuToggle.addEventListener('click', (e) => {
    e.preventDefault();
    chatMenu.classList.toggle('visible');
    chatArea.classList.toggle('expanded');
    menuToggle.classList.toggle('active');
    
    // Update ARIA attributes for accessibility
    const isExpanded = chatMenu.classList.contains('visible');
    menuToggle.setAttribute('aria-expanded', isExpanded);
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!chatMenu.contains(e.target) && !menuToggle.contains(e.target) && chatMenu.classList.contains('visible')) {
        chatMenu.classList.remove('visible');
        chatArea.classList.add('expanded');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    }
});

// Handle touch events for the menu
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) { // Swipe right
            chatMenu.classList.add('visible');
            chatArea.classList.remove('expanded');
            menuToggle.classList.add('active');
            menuToggle.setAttribute('aria-expanded', 'true');
        } else { // Swipe left
            chatMenu.classList.remove('visible');
            chatArea.classList.add('expanded');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    }
}

// Add touch event listeners for better mobile experience
menuToggle.addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent default touch behavior
    this.classList.add('pressed');
});

menuToggle.addEventListener('touchend', function() {
    this.classList.remove('pressed');
});

messageForm.addEventListener('submit', handleMessageSubmit);

newChatBtn.addEventListener('click', createNewChat);

// Auto-resize textarea
messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
});

// Add Enter key functionality to send messages
messageInput.addEventListener('keydown', (e) => {
    // Send message on Enter key, but allow Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
});

// Add visual feedback for send button
const sendButton = messageForm.querySelector('button[type="submit"]');
sendButton.addEventListener('mousedown', () => {
    sendButton.classList.add('active');
});

document.addEventListener('mouseup', () => {
    sendButton.classList.remove('active');
});

// Improved touch support for send button
sendButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    sendButton.classList.add('active');
    
    // Add a direct click handler for mobile devices
    const clickEvent = new Event('submit');
    setTimeout(() => {
        messageForm.dispatchEvent(clickEvent);
    }, 10);
});

sendButton.addEventListener('touchend', () => {
    sendButton.classList.remove('active');
});

// Ensure the form submit button works on all devices
sendButton.addEventListener('click', (e) => {
    e.preventDefault();
    messageForm.dispatchEvent(new Event('submit'));
});

// Functions
function createNewChat() {
    currentChatId = Date.now().toString();
    chats[currentChatId] = [];
    updateLocalStorage();
    updateChatHistory();
    clearMessages();
}

function updateLocalStorage() {
    localStorage.setItem('chats', JSON.stringify(chats));
}

function deleteChat(chatId, event) {
    event.stopPropagation();
    delete chats[chatId];
    if (chatId === currentChatId) {
        currentChatId = null;
        clearMessages();
    }
    updateLocalStorage();
    updateChatHistory();
}

function updateChatHistory() {
    chatHistory.innerHTML = '';
    Object.entries(chats)
        .sort((a, b) => b[0] - a[0]) // Sort by chat ID (timestamp) in descending order
        .forEach(([chatId, messages]) => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-history-item';

            const chatTitle = document.createElement('div');
            chatTitle.className = 'chat-title';
            chatTitle.textContent = messages.length > 0 
                ? messages[0].content.substring(0, 30) + '...'
                : 'New Chat';
            chatItem.appendChild(chatTitle);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-chat-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', (e) => deleteChat(chatId, e));
            chatItem.appendChild(deleteBtn);

            chatItem.addEventListener('click', () => loadChat(chatId));
            chatHistory.appendChild(chatItem);
        });
}

function loadChat(chatId) {
    currentChatId = chatId;
    clearMessages();
    chats[chatId].forEach(message => {
        appendMessage(message.content, message.role === 'user');
    });
    chatMenu.classList.remove('visible');
    chatArea.classList.add('expanded');
}

function clearMessages() {
    messagesContainer.innerHTML = '';
}

function appendMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    messageDiv.textContent = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingAnimation() {
    typingAnimation.classList.remove('hidden');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingAnimation() {
    typingAnimation.classList.add('hidden');
}

async function handleMessageSubmit(e) {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    // Remove any lingering listening message
    const lastMessage = messagesContainer.lastElementChild;
    if (lastMessage && lastMessage.innerHTML.includes('Listening to your voice')) {
        messagesContainer.removeChild(lastMessage);
    }

    // Create new chat if none exists
    if (!currentChatId) {
        createNewChat();
    }

    // Add user message
    appendMessage(message, true);
    chats[currentChatId].push({ role: 'user', content: message });
    updateLocalStorage();
    updateChatHistory();

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Show typing animation
    showTypingAnimation();

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'QiChat'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: chats[currentChatId]
            })
        });

        const data = await response.json();
        hideTypingAnimation();

        if (data.choices && data.choices[0]) {
            const botMessage = data.choices[0].message.content;
            appendMessage(botMessage, false);
            chats[currentChatId].push({ role: 'assistant', content: botMessage });
            updateLocalStorage();
            updateChatHistory();
        } else {
            throw new Error('Invalid response from API');
        }
    } catch (error) {
        hideTypingAnimation();
        appendMessage('Sorry, I encountered an error. Please try again.', false);
        console.error('Error:', error);
    }
}

// Create initial chat if none exists
if (Object.keys(chats).length === 0) {
    createNewChat();
}

// Add file input event listener
fileInput.addEventListener('change', handleFileUpload);

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageData = e.target.result;
                const messageContainer = document.createElement('div');
                messageContainer.className = 'message user';
                messageContainer.style.textAlign = 'right';

                // File name display
                const fileNameDiv = document.createElement('div');
                fileNameDiv.className = 'file-info';
                fileNameDiv.innerHTML = `<i class="fas fa-file-image"></i> ${file.name}`;
                fileNameDiv.style.marginBottom = '8px';
                fileNameDiv.style.color = 'rgba(255,255,255,0.7)';
                messageContainer.appendChild(fileNameDiv);

                // Image content
                const img = document.createElement('img');
                img.src = imageData;
                img.style.maxWidth = '100%';
                img.style.borderRadius = '5px';
                messageContainer.appendChild(img);

                messagesContainer.appendChild(messageContainer);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                // Add to chat history
                if (!currentChatId) createNewChat();
                const content = `[Image] ${file.name}`;
                chats[currentChatId].push({ role: 'user', content: content });
                updateLocalStorage();
                updateChatHistory();
                
                // Clear the file input
                event.target.value = '';
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'text/plain' || file.type === 'application/pdf' || 
                   file.type === 'application/msword' || 
                   file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target.result;
                const messageContainer = document.createElement('div');
                messageContainer.className = 'message user';
                messageContainer.style.textAlign = 'right';

                // File name display
                const fileNameDiv = document.createElement('div');
                fileNameDiv.className = 'file-info';
                fileNameDiv.innerHTML = `<i class="fas fa-file-alt"></i> ${file.name}`;
                fileNameDiv.style.marginBottom = '8px';
                fileNameDiv.style.color = 'rgba(255,255,255,0.7)';
                messageContainer.appendChild(fileNameDiv);

                // Content display
                const contentDiv = document.createElement('div');
                contentDiv.textContent = content.substring(0, 1000) + (content.length > 1000 ? '...' : '');
                messageContainer.appendChild(contentDiv);

                messagesContainer.appendChild(messageContainer);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                // Add to chat history
                if (!currentChatId) createNewChat();
                const messageContent = `[Document] ${file.name}\n${content}`;
                chats[currentChatId].push({ role: 'user', content: messageContent });
                updateLocalStorage();
                updateChatHistory();
                
                // Clear the file input
                event.target.value = '';
            };
            reader.readAsText(file);
        }
    } catch (error) {
        console.error('Error processing file:', error);
        appendMessage('Error processing file. Please try again.', false);
    }
}