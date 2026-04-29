const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the current directory (where index.html is)
app.use(express.static(__dirname));

// Make sure index.html is served for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const users = {};

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('user-joined', (username) => {
    users[socket.id] = username;
    socket.broadcast.emit('user-joined', username);
    io.emit('online-users', Object.values(users));
  });

  socket.on('send-message', (data) => {
    io.emit('receive-message', {
      username: data.username,
      message: data.message,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('user-typing', username);
  });

  socket.on('stop-typing', () => {
    socket.broadcast.emit('stop-typing');
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];
      io.emit('user-left', username);
      io.emit('online-users', Object.values(users));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Chat server running at http://localhost:${PORT}`);
});