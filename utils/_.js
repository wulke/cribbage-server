
const MapValuesToArray = (map) => {
  return Array.from(map, ([key, value]) => (value));
}

module.exports = {
  toArray: MapValuesToArray
};