import { useDeck } from '../../models/deck';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Deck tests', () => {
  let deck;
  beforeEach(() => {
    deck = useDeck();
  });
  it('Creates a Deck', async () => {
    expect(deck.deck.length).toEqual(52);
  });
  it('Shuffles a Deck', async () => {
    expect(deck.deck.every((card, index) => card === index)).toBe(true);
    deck.shuffle();
    expect(deck.deck.every((card, index) => card === index)).toBe(false);
  });
  it('Cuts a deck', async () => {
    const cut = 20;
    deck.shuffle();
    const prev = Object.assign([], deck.deck);
    deck.cut(cut);
    expect(deck.size()).toStrictEqual(prev.length);
    for(let idx=0; idx<deck.size(); idx++) {
      let prevIdx = idx+cut;
      if (prevIdx >= deck.size()) {
        prevIdx -= deck.size();
      }
      expect(prev[prevIdx]).toStrictEqual(deck.deck[idx]);
    }
  });
  it('Resets', async () => {
    deck.shuffle();
    expect(deck.deck.every((card, index) => card === index)).toBe(false);
    deck.reset();
    expect(deck.deck.every((card, index) => card === index)).toBe(true);
  });
  it('Peeks', async () => {
    expect(deck.peek()).toStrictEqual(deck.deck[0]);
  });
  it('Pulls', async () => {
    deck.shuffle();
    const card = deck.pull(Math.floor(Math.random() * deck.size()));
    expect(deck.size()).toStrictEqual(51);
    expect(deck.deck.every((c) => c !== card)).toBe(true);
  });
});