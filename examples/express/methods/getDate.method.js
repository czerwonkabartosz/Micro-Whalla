var Method = require('../../../index').Method;

function getDate(req, res) {
  var data = req.data;
  res.done('Today is ' + data.param);
}

module.exports = new Method('getDate', getDate);
