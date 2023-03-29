const uuid = (seed = 46656) => {
  let first = (Math.random() * seed) | 0;
  let second = (Math.random() * seed) | 0;
  return ("0000" + first.toString(36)).slice(-4) + ("0000" + second.toString(36)).slice(-4);
};

module.exports = {
  uuid
};