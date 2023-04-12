const DEFAULT = [...Array(52).keys()];

class Deck {
  constructor() {
    this.deck = Object.assign([], DEFAULT);
  };
  cut = (index = Math.floor(Math.random() * this.deck.length)) => {
    this.deck = [...this.deck.slice(index), ...this.deck.slice(0, index)];
  };
  peek = (index = 0) => this.deck[index];
  pull = (index) => {
    const card = this.deck[index];
    this.deck.splice(index, 1);
    return card;
  };
  reset = () => { this.deck = Object.assign([], DEFAULT); return this; }
  shuffle = (count = 7) => {
    for (let i = this.deck.length -1; i>0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      let temp = this.deck[i];
      this.deck[i] = this.deck[j];
      this.deck[j] = temp;
    }
    if (count > 0) this.shuffle(count-1);
  };
  size = () => this.deck.length;
};

const generateDeck = () => new Deck();

module.exports = {
  useDeck: generateDeck
};