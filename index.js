var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var moment = require('moment');
var redis = require('redis');
var async = require('async');

var client = redis.createClient(6379, '127.0.0.1');

var PATH_TO_LOG = './logs/'
var logs = fs.readdirSync(PATH_TO_LOG);
var getRegex = /\[(.*)\].*\/bars\/get\/id\/(.{24})/;


var queue = async.queue(function (file, callback) {
  var instream = fs.createReadStream(PATH_TO_LOG + file);
  var outstream = new stream();
  var rl = readline.createInterface(instream, outstream);


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
    callback();
  });
}, 1);


logs.forEach(function(file) {
  queue.push(file, function() { console.log(file + ' done.')});
});

