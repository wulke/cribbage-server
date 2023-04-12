const { uuid } = require('../utils/uuid');
const { useDeck } = require('../models/deck');
const { toSuit, toValue, toRank } = require('../utils/card');

const GameState = {
  NOT_STARTED: 'Not Started',
  CUT_FOR_DEALER: 'Cut For Dealer',
  NEW_HAND: 'New Hand',
};
const GameStatus = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};
const PlayerStatus = {
  JOINED: "Joined",
  READY: "Ready",
  IN_GAME: "In Game",
};

/**
 * 
 * -- Attributes --
 * public {string} id
 * public {number} maxPlayers
 * public {} players
 * public {GameState} state
 * pulbic {GameStatus} status
 * public {Deck} deck
 * -- Methods --
 * onGameStart = () =>
 * onPlayerJoin = () =>
 * onPlayerLeave = () =>
 * onPlayerReady = () =>
 * isEmpty = () =>
 * isFull = () =>
 */
class Game {
  constructor(config) {
    this.id = uuid();
    this.maxPlayers = config.players;
    this.players = {};
    this.state = GameState.NOT_STARTED;
    this.status = GameStatus.OPEN;
    this.deck = useDeck();
    /**  **/
    this.playerCuts = {};
    this.nextDealer = null;
  }
  /** Game-related state updates */
  onGameStart = () => {
    this.status = GameStatus.IN_PROGRESS;
    Object.keys(this.players).forEach((id) => this.players[id] = PlayerStatus.IN_GAME);
    this.deck.shuffle();
    this.state = GameState.CUT_FOR_DEALER;
    return this;
  };
  onCutForDealer = (playerId, cutIndex) => {
    if (this.playerCuts[playerId]) {
      throw new Error(`${playerId} already cut for dealer: ${this.playerCuts[playerId]}`);
    }
    const card = this.deck.pull(cutIndex);
    this.playerCuts[playerId] = card;
    this.#processCutForDealer();
    return this;
  };
  /** Player-related state updates */
  onPlayerJoin = (playerId) => {
    // if (this.players.find(({ id }) => playerId === id)) {
    if (this.players[playerId]) {
      throw new Error(`Player ${playerId} already joined game ${this.id}`);
    }
    if (Object.keys(this.players).length === this.maxPlayers) {
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

  /** Private Functions */
  #processCutForDealer = () => {
    const playerCuts = Object.keys(this.playerCuts);
    // (1) check all players have made a cut
    if (!(Object.keys(this.players).every((p) => playerCuts.includes(p)))) {
      return;
    }
    let dealers = [];
    // (2) get the lowest cut card(s) to determine dealer
    Object.entries(this.playerCuts).forEach(([id, cut]) => {
      console.info(`${id}: ${toValue(cut)}${toSuit(cut)}`);
      if (dealers.length === 0 || toRank(cut) < toRank(dealers[0][1])) {
        dealers = [[id, cut]];
      } else if (toRank(cut) === toRank(dealers[0][1])) {
        dealers.push([id, cut]);
      }
    });
    // (3)
    if (dealers.length === 1) {
      this.nextDealer = dealers[0][0];
      this.state = GameState.NEW_HAND;
      return;
    } else {
      dealers.forEach(([id,]) => delete this.playerCuts[id]);
      return;
    }
  };
};

const defaultGame = (players = 2) => {
  const config = {
    players
  };
  return new Game(config);
};

module.exports = {
  useDefaultGame: defaultGame,
  GameState,
  GameStatus,
  PlayerStatus,
};