const suits = ['C','H','S','D'];
const values = ['A','2','3','4','5','6','7','8','X','J','Q','K'];
const toRank = (card) => card % 13;
const toSuit = (card) => suits[Math.floor(card / 13)];
const toValue = (card) => values[toRank(card)];
const toString = (card) => `${toValue(card)}${toSuit(card)}`;

module.exports = {
  toRank,
  toSuit,
  toValue,
  toString,
};