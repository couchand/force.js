var i = require('./script.js');
var r = require('./runner.js');
exports.suite = new r.Suite( i.setUp, null, [new r.Test( i['make and find sobjects'] )] );

