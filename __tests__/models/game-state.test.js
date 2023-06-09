import { beforeEach, describe, expect, it } from 'vitest';
import { useDefaultGame, GameState, GameStatus, PlayerStatus } from '../../models/game-state';
import { uuid } from '../../utils/uuid';

const PLAYER_1 = uuid();
const PLAYER_2 = uuid();
const PLAYER_3 = uuid();

// @todo add support for parameterized tests for 2/3/4 player games
describe('GameState', () => {
  let game;
  beforeEach(() => {
    game = useDefaultGame();
  });

  describe(GameState.NOT_STARTED, () => {
    it('Initializes default game settings', async () => {
      expect(game.maxPlayers === 2); // @todo update to match against config
      expect(game.players).toEqual({});
      expect(game.state).toStrictEqual(GameState.NOT_STARTED);
      expect(game.status).toStrictEqual(GameStatus.OPEN);
      expect(game.deck.deck.length).toStrictEqual(52);
      expect(game.isEmpty()).toBe(true);
      expect(game.isFull()).toBe(false);
    });
    it('Allows players to join and leave', async () => {
      game.onPlayerJoin(PLAYER_1);
      expect(game.players[PLAYER_1]).toStrictEqual(PlayerStatus.JOINED);
      game.onPlayerLeave(PLAYER_1);
      expect(game.players[PLAYER_1]).toBeUndefined();
    });
    it('onPlayerJoin() throws an error if the player has already joined the game', async () => {
      game.onPlayerJoin(PLAYER_1);
      expect(() => game.onPlayerJoin(PLAYER_1)).toThrowError(`Player ${PLAYER_1} already joined game ${game.id}`);
    });
    it('onPlayerJoin() throws an error if the game is full', async () => {
      game.onPlayerJoin(PLAYER_1);
      game.onPlayerJoin(PLAYER_2);
      expect(() => game.onPlayerJoin(PLAYER_3)).toThrowError(`${game.id} is already full`);
    });
    it('onPlayerLeave() throws an error if the player has not joined the game', async () => {
      expect(() => game.onPlayerLeave(PLAYER_1)).toThrowError(`Player ${PLAYER_1} has not joined game ${game.id}`);
    });
    it('Allows players to Ready for game', async () => {
      game.onPlayerJoin(PLAYER_1);
      expect(game.players[PLAYER_1]).toStrictEqual(PlayerStatus.JOINED);
      game.onPlayerReady(PLAYER_1);
      expect(game.players[PLAYER_1]).toStrictEqual(PlayerStatus.READY);
    });
    it('onPlayerReady() throws an error if the player has not joined the game', async () => {
      expect(() => game.onPlayerReady(PLAYER_1)).toThrowError(`Player ${PLAYER_1} has not joined game ${game.id}`);
    });
  });
  describe(GameState.CUT_FOR_DEALER, () => {
    beforeEach(() => {
      game.onPlayerJoin(PLAYER_1);
      game.onPlayerReady(PLAYER_1);
      game.onPlayerJoin(PLAYER_2);
      game.onPlayerReady(PLAYER_2);
      expect(game.isFull()).toBe(true);
      expect(game.allReady()).toBe(true);
      game.onGameStart();
    });
    it('Transitions state and status when all players are ready', async () => {
      expect(game.status).toStrictEqual(GameStatus.IN_PROGRESS);
      expect(game.state).toStrictEqual(GameState.CUT_FOR_DEALER);
      expect(Object.values(game.players).every((value) => value === PlayerStatus.IN_GAME));
    });
    it('Remains in CUT_FOR_DEALER phase if there is a draw for dealer', async () => {
      game.deck.reset(); // reset deck so we can force lowest cut
      const player1CutIndex = 0;
      const player1Cut = game.deck.peek(player1CutIndex);
      game.onCutForDealer(PLAYER_1, player1CutIndex);
      expect(game.state).toStrictEqual(GameState.CUT_FOR_DEALER);
      expect(game.playerCuts[PLAYER_1]).toStrictEqual(player1Cut);
      expect(game.playerCuts[PLAYER_2]).toBeUndefined();
      const player2CutIndex = 12;
      const player2Cut = game.deck.peek(player2CutIndex);
      game.onCutForDealer(PLAYER_2, player2CutIndex);
      expect(game.playerCuts[PLAYER_1]).toBeUndefined
      expect(game.playerCuts[PLAYER_2]).toBeUndefined(player2Cut);
      expect(game.state).toStrictEqual(GameState.CUT_FOR_DEALER);
      expect(game.nextDealer).toBeNull();
    });
    it('Transitions to NEW_HAND phase when all players have cut for dealer', async () => {
      game.deck.reset(); // reset deck so we can force lowest cut
      const player1CutIndex = 0;
      const player1Cut = game.deck.peek(player1CutIndex);
      game.onCutForDealer(PLAYER_1, player1CutIndex);
      expect(game.state).toStrictEqual(GameState.CUT_FOR_DEALER);
      expect(game.playerCuts[PLAYER_1]).toStrictEqual(player1Cut);
      expect(game.playerCuts[PLAYER_2]).toBeUndefined();
      const player2CutIndex = 1;
      const player2Cut = game.deck.peek(player2CutIndex);
      game.onCutForDealer(PLAYER_2, player2CutIndex);
      expect(game.playerCuts[PLAYER_2]).toStrictEqual(player2Cut);
      expect(game.state).toStrictEqual(GameState.NEW_HAND);
      expect(game.nextDealer).toStrictEqual(PLAYER_1);
    });
    it('onCutForDealer() throws an error if a player not in the game attempts to make a cut', async () => {
      expect(() => game.onCutForDealer(PLAYER_3)).toThrowError(`${PLAYER_3} is not a player in game ${game.id}`);
    });
  });
  describe(GameState.NEW_HAND, () => {
    beforeEach(() => {
      game.onPlayerJoin(PLAYER_1);
      game.onPlayerReady(PLAYER_1);
      game.onPlayerJoin(PLAYER_2);
      game.onPlayerReady(PLAYER_2);
      game.onGameStart();
      game.deck.reset();
      game.onCutForDealer(PLAYER_1, 0);
      game.onCutForDealer(PLAYER_2, 0);
      expect(game.state).toStrictEqual(GameState.NEW_HAND);
      expect(game.nextDealer).toStrictEqual(PLAYER_1);
    });
    it('Updates to the next dealer in the rotation', async () => {
      game.onNewHand();
      expect(game.currentDealer).toStrictEqual(PLAYER_1);
      expect(game.nextDealer).toStrictEqual(PLAYER_2);
      expect(game.crib.length).toBe(0);
    });
    it('Deals hands and sets game state to "Throw Crib Cards"', async () => {
      game.onNewHand();
      Object.entries(game.playerHands).forEach(([p,h]) => {
        expect(h.length).toStrictEqual(game.CARDS_PER_HAND);
      });
      expect(game.deck.size()).toStrictEqual(40); // @todo based on config # of players
      expect(game.state).toStrictEqual(GameState.THROW_CRIB);
    });
  });
  describe(GameState.THROW_CRIB, () => {
    beforeEach(() => {
      game.onPlayerJoin(PLAYER_1);
      game.onPlayerReady(PLAYER_1);
      game.onPlayerJoin(PLAYER_2);
      game.onPlayerReady(PLAYER_2);
      game.onGameStart();
      game.deck.reset();
      game.onCutForDealer(PLAYER_1, 0);
      game.onCutForDealer(PLAYER_2, 0);
      game.onNewHand();
      expect(game.state).toStrictEqual(GameState.THROW_CRIB);
      expect(game.crib.length).toBe(0);
    });
    it('onThrowToCrib() throws an error if player has already thrown max cards', async () => {
      game.onThrowToCrib(PLAYER_1, game.playerHands[PLAYER_1][0]);
      game.onThrowToCrib(PLAYER_1, game.playerHands[PLAYER_1][0]); // @todo based on config # of players
      expect(() => game.onThrowToCrib(PLAYER_1, game.playerHands[PLAYER_1][0])).toThrowError();
    });
    it('onThrowToCrib() throws an error if player does not exist in the game', async () => {
      expect(() => game.onThrowToCrib(PLAYER_3, 0)).toThrowError();
    });
    it('onThrowToCrib() throws an error if player does not have the card in their hand', async () => {
      expect(() => game.onThrowToCrib(PLAYER_1, game.playerHands[PLAYER_2][0])).toThrowError();
    });
    it('Lets players throw to crib and updates game phase to "Cut For Dealer"', async () => {
      let card = game.playerHands[PLAYER_1][0];
      game.onThrowToCrib(PLAYER_1, card);
      expect(game.state).toStrictEqual(GameState.THROW_CRIB);
      expect(game.crib).toContain(card);

      card = game.playerHands[PLAYER_2][0];
      game.onThrowToCrib(PLAYER_2, card);
      expect(game.state).toStrictEqual(GameState.THROW_CRIB);
      expect(game.crib).toContain(card);

      card = game.playerHands[PLAYER_1][0];
      game.onThrowToCrib(PLAYER_1, card);
      expect(game.state).toStrictEqual(GameState.THROW_CRIB);
      expect(game.crib).toContain(card);


      card = game.playerHands[PLAYER_2][0];
      game.onThrowToCrib(PLAYER_2, card);
      expect(game.state).toStrictEqual(GameState.CUT_FOR_HAND);
      expect(game.crib).toContain(card);
      expect(game.crib.length).toStrictEqual(4);
    });
  });
  describe(GameState.CUT_FOR_HAND, () => {
    beforeEach(() => {
      game.onPlayerJoin(PLAYER_1);
      game.onPlayerReady(PLAYER_1);
      game.onPlayerJoin(PLAYER_2);
      game.onPlayerReady(PLAYER_2);
      game.onGameStart();
      game.deck.reset();
      game.onCutForDealer(PLAYER_1, 0);
      game.onCutForDealer(PLAYER_2, 0);
      game.onNewHand();
      game.onThrowToCrib(PLAYER_1, game.playerHands[PLAYER_1][0]);
      game.onThrowToCrib(PLAYER_1, game.playerHands[PLAYER_1][0]);
      game.onThrowToCrib(PLAYER_2, game.playerHands[PLAYER_2][0]);
      game.onThrowToCrib(PLAYER_2, game.playerHands[PLAYER_2][0]);
      expect(game.state).toStrictEqual(GameState.CUT_FOR_HAND);
      expect(game.cut).toBeNull();
    });
    it("Let's correct player cut card", async () => {
      let cutter = game.nextDealer;
      game.onCutForHand(cutter, 0);
      expect(game.state).toStrictEqual(GameState.PEGGING);
    });
    it('onCutForHand() throws an error if an invalid player tries to cut', async () => {
      let cutter = game.currentDealer;
      expect(() => game.onCutForHand(cutter, 0)).toThrowError();
    });
  });
});