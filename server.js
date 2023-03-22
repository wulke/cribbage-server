const express = require('express');
const app = express();
const cors = require('cors');
const server = require('http').createServer(app);
const ws = require('ws');
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET","POST"]
  },
  wsEngine: ws.Server
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

server.listen(PORT, () => {
  console.log(`server started on Port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log(`user ${socket.id} has connected`);
  io.to(socket.id).emit('server_id', socket.id);

  socket.on('disconnect', () => {
    console.log(`${socket.id} has disconnected`);
  });
});