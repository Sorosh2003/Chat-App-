const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users = {};

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // New user joins
  socket.on('user-joined', (username) => {
    users[socket.id] = username;
    socket.broadcast.emit('user-joined', username);
    io.emit('online-users', Object.values(users));
    console.log(`${username} joined the chat`);
  });

  // User sends message
  socket.on('send-message', (data) => {
    io.emit('receive-message', {
      username: data.username,
      message: data.message,
      time: new Date().toLocaleTimeString()
    });
  });

  // User typing indicator
  socket.on('typing', (username) => {
    socket.broadcast.emit('user-typing', username);
  });

  socket.on('stop-typing', () => {
    socket.broadcast.emit('stop-typing');
  });

  // User disconnects
  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];
      io.emit('user-left', username);
      io.emit('online-users', Object.values(users));
      console.log(`${username} left the chat`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Chat server running at http://localhost:${PORT}`);
});