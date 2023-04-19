const { uuid } = require('../utils/uuid');
const { useDeck } = require('../models/deck');
const { toSuit, toValue, toRank } = require('../utils/card');

const GameState = {
  NOT_STARTED: 'Not Started',
  CUT_FOR_DEALER: 'Cut For Dealer',
  CUT_FOR_HAND: 'Cut For Hand',
  NEW_HAND: 'New Hand',
  THROW_CRIB: 'Throw Crib',
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
 * onCutForDealer = () =>
 * onNewHand = () =>
 * onPlayerJoin = () =>
 * onPlayerLeave = () =>
 * onPlayerReady = () =>
 * allReady = () =>
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
    this.CARDS_PER_HAND = config.CARDS_PER_HAND;
    /**  **/
    this.playerCuts = {};
    this.playerHands = {};
    this.currentDealer = null;
    this.nextDealer = null;
    this.crib = [];
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
    if (!this.players[playerId]) {
      throw new Error(`${playerId} is not a player in game ${this.id}`);
    }
    const card = this.deck.pull(cutIndex);
    this.playerCuts[playerId] = card;
    this.#processCutForDealer();
    return this;
  };
  onNewHand = () => {
    // @todo create game events queue for tracking events and to allow playback in UI
    let player = this.nextDealer;
    const players = Object.keys(this.players);
    let dealIndex = players.indexOf(player);
    this.#resetCrib();
    this.#resetPlayerHands();
    this.#setNextDealer();
    this.deck.reset();
    this.deck.shuffle();

    while(!this.#isDealingComplete()) {
      dealIndex += 1;
      if (dealIndex >= players.length) {
        dealIndex = 0;
      }
      player = players[dealIndex];
      if (!player) {
        throw new Error(`Error dealing game`);
      }
      this.playerHands[player] = [].concat(this.playerHands[player], [this.deck.deal()]);
    }

    this.state = GameState.THROW_CRIB;
    return this;
  };
  onThrowToCrib = (playerId, card) => {
    let hand = this.playerHands[playerId];
    if (!hand) {
      throw new Error(`Player ${playerId} is not in game ${this.id}`);
    }
    if (hand.length === 4) {
      throw new Error(`Player ${playerId} has completed throwing to crib`);
    }
    // 1) {playerId} has already thrown max cards
    // 3) {playerId} does not have {card} in their hand
    const cardIndex = hand.indexOf(card);
    if (cardIndex === -1) {
      throw new Error(`Player ${playerId} does not have card ${card} in their hand`);
    }

    this.crib.push(card);
    hand.splice(cardIndex, 1);
    this.playerHands[playerId] = hand;
    
    if (this.#isThrowingToCribComplete()) {
      this.state = GameState.CUT_FOR_HAND;
    }
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
  /** Read-only state requests */
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
  #resetCrib = () => {
    this.crib = [];
  };
  #resetPlayerHands = () => {
    Object.keys(this.players).forEach((p) => {
      this.playerHands[p] = [];
    });
  };
  #setNextDealer = () => {
    const players = Object.keys(this.players);
    const currentDealerIndex = players.indexOf(this.nextDealer);
    let nextDealerIndex = currentDealerIndex + 1;
    if (nextDealerIndex >= players.length) {
      nextDealerIndex = 0;
    }
    this.currentDealer = this.nextDealer;
    this.nextDealer = players[nextDealerIndex];
  };
  #isDealingComplete = () => {
    return Object.values(this.playerHands).every((hand) => hand.length === this.CARDS_PER_HAND);
  };
  #isThrowingToCribComplete = () => {
    return Object.values(this.playerHands).every((hand) => hand.length === 4);
  };
};

const defaultGame = (players = 2) => {
  const config = {
    players,
    CARDS_PER_HAND: 6
  };
  return new Game(config);
};

module.exports = {
  useDefaultGame: defaultGame,
  GameState,
  GameStatus,
  PlayerStatus,
};