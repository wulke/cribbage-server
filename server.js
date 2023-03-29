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
const { uuid } = require('./utils/uuid');

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const games = [];

server.listen(PORT, () => {
  console.log(`server started on Port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log(`user ${socket.id} has connected`);
  io.to(socket.id).emit('server_id', socket.id);
  io.to(socket.id).emit('get_games', games);

  socket.on('new_game', (callback) => {
    console.log(`${socket.id} has initiated a new game`);
    // @todo client can only initiate one game at a time.
    // @todo create GameState model
    // @todo id collision check?
    const game = { id: uuid(), players: [] }
    games.push(game);
    io.emit('get_games', games);
    callback(game.id);
  });

  socket.on('join_game', (id, callback) => {
    console.log(`${socket.id} is joining game ${id}`);
  });

  socket.on('disconnect', () => {
    console.log(`${socket.id} has disconnected`);
  });
});