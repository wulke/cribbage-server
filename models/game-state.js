const { uuid } = require("../utils/uuid");

const GameStatus = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};
const PlayerStatus = {
  JOINED: "Joined",
  READY: "Ready",
  PLAYING: "Playing",
};

/**
 * 
 * -- Attributes --
 * public {string} id
 * public {number} maxPlayers
 * public {string[]} players
 * pulbic {GameStatus} status
 * -- Methods --
 * onPlayerJoin = () =>
 * onPlayerLeave = () =>
 * isEmpty = () =>
 * isFull = () =>
 */
class GameState {
  constructor(config) {
    this.id = uuid();
    this.maxPlayers = config.players;
    this.players = {};
    this.status = GameStatus.OPEN;
  }
  /** Game-related state updates */
  onGameStart = () => {
    this.status = GameStatus.IN_PROGRESS;
    // @todo randomly decide dealer?
    return this;
  };
  /** Player-related state updates */
  onPlayerJoin = (playerId) => {
    // if (this.players.find(({ id }) => playerId === id)) {
    if (this.players[playerId]) {
      throw new Error(`Player ${playerId} already joined game ${this.id}`);
    }
    if (Object.keys(this.players).length === this.maxPayers) {
      throw new Error(`${this.id} is already full`);
    }
    this.players[playerId] = PlayerStatus.JOINED;
    return this;
  };
  onPlayerLeave = (playerId) => {
    if (!this.players[playerId]) {
      throw new Error(`Player ${playerId} has not joined game ${this.id}`);
    }
    delete this.players[playerId];
    return this;
  };
  onPlayerReady = (playerId) => {
    if (!this.players[playerId]) {
      throw new Error(`Player ${playerId} has not joined game ${this.id}`);
    }
    // @todo check if status is already PlayerStatus.READY?
    this.players[playerId] = PlayerStatus.READY;
    return this;
  };

  allReady = () => this.isFull() && Object.values(this.players).every((status) => status === PlayerStatus.READY);
  isEmpty = () => Object.keys(this.players).length === 0;
  isFull = () => Object.keys(this.players).length === this.maxPlayers;
};

const defaultGame = (players) => {
  const config = {
    players
  };
  return new GameState(config);
};

module.exports = {
  default: GameState,
  useDefaultGame: defaultGame
};