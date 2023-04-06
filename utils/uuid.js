const shortid = require('shortid');

module.exports = {
  uuid: () => shortid.generate()
};