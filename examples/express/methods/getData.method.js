var Method = require('../../../index').Method;

function getData(req, res) {
  res.done(this.repository());
}

module.exports = new Method('getData', getData);
