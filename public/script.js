const socket = io();

let currentUser = '';

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatRoom = document.getElementById('chatRoom');
const usernameInput = document.getElementById('username');
const joinBtn = document.getElementById('joinBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messages');
const usersList = document.getElementById('usersList');
const onlineCountSpan = document.querySelector('#onlineCount span');
const typingIndicator = document.getElementById('typingIndicator');

let typingTimeout;

// Join chat
joinBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (username === '') {
    alert('Please enter a username');
    return;
  }
  
  currentUser = username;
  socket.emit('user-joined', username);
  
  loginScreen.style.display = 'none';
  chatRoom.style.display = 'block';
  messageInput.focus();
});

// Send message
function sendMessage() {
  const message = messageInput.value.trim();
  if (message === '') return;
  
  socket.emit('send-message', {
    username: currentUser,
    message: message
  });
  
  messageInput.value = '';
  messageInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Typing indicator
messageInput.addEventListener('input', () => {
  socket.emit('typing', currentUser);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop-typing');
  }, 1000);
});

// Receive message
socket.on('receive-message', (data) => {
  addMessage(data.username, data.message, data.time, data.username === currentUser);
});

// User joined
socket.on('user-joined', (username) => {
  addSystemMessage(`${username} joined the chat`);
});

// User left
socket.on('user-left', (username) => {
  addSystemMessage(`${username} left the chat`);
});

// Update online users
socket.on('online-users', (users) => {
  updateOnlineUsers(users);
  onlineCountSpan.textContent = `${users.length} online`;
});

// Typing indicator
socket.on('user-typing', (username) => {
  typingIndicator.textContent = `${username} is typing...`;
});

socket.on('stop-typing', () => {
  typingIndicator.textContent = '';
});

// Add message to chat
function addMessage(username, message, time, isSent) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
  messageDiv.innerHTML = `
    <div class="message-info">
      <span class="message-sender">${username}</span>
      <span class="message-time">${time || new Date().toLocaleTimeString()}</span>
    </div>
    <div class="message-text">${escapeHtml(message)}</div>
  `;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add system message
function addSystemMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'system-message';
  messageDiv.textContent = message;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Update online users list
function updateOnlineUsers(users) {
  usersList.innerHTML = '';
  users.forEach(user => {
    const userDiv = document.createElement('div');
    userDiv.className = 'user-item';
    userDiv.innerHTML = `
      <i class="fas fa-circle"></i>
      <span>${escapeHtml(user)}</span>
    `;
    usersList.appendChild(userDiv);
  });
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}