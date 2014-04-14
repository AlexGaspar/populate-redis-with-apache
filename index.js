var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var moment = require('moment');
var redis = require('redis');

var client = redis.createClient(6379, '127.0.0.1');

var instream = fs.createReadStream('manycontacts-access.log');
var outstream = new stream;
var rl = readline.createInterface(instream, outstream);

var getRegex = /\[(.*)\].*\/bars\/get\/id\/(.{24})/;

rl.on('line', function(line) {
  var array = line.match(getRegex);
  if(array) {
    var date = moment(array[1].split(':')[0], "DD-MMM-YYYY");
    var barId = array[2];

    var key = barId + ':' + date.format('YYYYMMDD');
    client.incr(key, redis.print);
  }
});

rl.on('close', function() {
  console.log('Done');
});
