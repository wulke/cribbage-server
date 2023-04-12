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

const _ = require('./utils/_');
const { useDefaultGame } = require('./models/game-state');

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const GAMES = new Map();

server.listen(PORT, () => {
  console.log(`server started on Port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log(`user ${socket.id} has connected`);
  io.to(socket.id).emit('server_id', socket.id);

  socket.on('new_game', (callback) => {
    console.log(`${socket.id} has initiated a new game`);
    // @todo client can only initiate one game at a time.
    // @todo id collision check?
    // @todo allow client to define game config
    const game = useDefaultGame(2);
    GAMES.set(game.id, game);
    io.emit('get_games', _.toArray(GAMES));
    callback(game.id);
  });

  socket.on('join_game', (id, callback) => {
    console.log(`${socket.id} is joining game ${id}`);
    const game = GAMES.get(id);
    // @todo create socket room with game id?
    socket.join(game.id);
    // @todo add player to game.players?
    // io.to(game.id).emit('notification', `${socket.id} is joining game ${id}`);

    try {
      // @todo add "join" methon in GameState which throws an error if game is full
      GAMES.set(game.id, game.onPlayerJoin(socket.id));
      io.emit('get_games', _.toArray(GAMES));
      io.to(game.id).emit('get_game', game);
    } catch (error) {
      console.error(error);
      io.to(socket.id).emit('notification', `Failed to join game ${game.id}`);
    }
  });

  socket.on('leave_game', (id, callback) => {
    console.log(`${socket.id} is leaving game ${id}`);
    try {
      GAMES.set(id, GAMES.get(id).onPlayerLeave(socket.id));
      io.emit('get_games', _.toArray(GAMES));
    } catch (error) {
      console.error(error);
      io.to(socket.id).emit('notification', `Failed to leave game ${id}`);
    }

    // @todo if no players remain in-game, setTimeout to close the game
    //  (gameId) => setTimeout((gameId) => if (games.get(gameId).isEmpty) delete game, 10000, gameId)
    // setTimeout((gameId) => {
    //   if (GAMES.get(gameId).isEmpty()) {
    //     console.log(`Deleting ${gameId}`);
    //     GAMES.delete(gameId);
    //     io.emit('get_games', _.toArray(GAMES));
    //   }
    // }, 10000, id);
  });

  socket.on('player_ready', (gameId, callback) => {
    console.log(`${socket.id} is ready to play ${gameId}`);
    try {
      let game = GAMES.get(gameId).onPlayerReady(socket.id);
      if (game.allReady()) {
        game = game.onGameStart();
      }
      GAMES.set(game.id, game);
      io.to(gameId).emit('get_game', GAMES.get(gameId));
    } catch (error) {
      console.error(error);
      io.to(socket.id).emit('notification', `Failed to ready game ${gameId}`);
    }
  });

  socket.on('cut_for_dealer', (gameId, cutIndex, callback) => {
    console.log(`Player ${socket.id} is cutting the ${cutIndex} index in ${gameId}`);
    try {
      GAMES.set(gameId, GAMES.get(gameId).onCutForDealer(socket.id, cutIndex));
      io.to(gameId).emit('get_game', GAMES.get(gameId));
    } catch (error) {
      console.error(error);
      io.to(socket.id).emit('notification', `Failed to cut for dealer in game ${gameId}`);
    }
  });

  socket.on('get_game', (id, callback) => {
    console.log(`${socket.id} is pulling game ${id}`);
    const game = GAMES.get(id);
    callback(game);
  });

  socket.on('get_games', (callback) => {
    callback(_.toArray(GAMES));
  });

  socket.on('disconnect', () => {
    console.log(`${socket.id} has disconnected`);
    // @todo check for any OPEN games the socket has joined
    //  () => remove the socket from those games.
    // @todo check for any IN_PROGRESS games the socket has joined
    //  () => forfeit those games for the socket.
    // @todo long term, support a user reconnecting to IN_PROGRESS games
  });
});