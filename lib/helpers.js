var nodeuuid = require('uuid');

function generateId() {
  return nodeuuid.v4();
}

function deserialize(obj) {
  try {
    return JSON.parse(obj);
  } catch (e) {
    return {};
  }
}

function serialize(obj) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return null;
  }
}

module.exports = {
  generateId: generateId,
  serialize: serialize,
  deserialize: deserialize
};
