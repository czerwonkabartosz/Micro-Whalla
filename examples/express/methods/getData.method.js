var Method = require('micro-whalla').Method;

function getData(req, res) {
  res.done(this.repository());
}

module.exports = new Method('getData', getData);
