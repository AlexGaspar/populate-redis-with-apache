var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var moment = require('moment');
var redis = require('redis');
var async = require('async');

//var client = redis.createClient(6379, '127.0.0.1');

var PATH_TO_LOG = '/mnt';
var dir_list = ['log-prod-1', 'log-prod-2', 'log-prod-3'];
var logs = [];

dir_list.forEach(function(dir) {
  var files = fs.readdirSync(PATH_TO_LOG + '/' + dir);
  files.forEach(function(file) {
    logs.push(PATH_TO_LOG + '/' + dir + '/' + file);
  });
});

var getRegex = /\[(.*)\].*\/bars\/get\/id\/(.{24})/;


var queue = async.queue(function (file, callback) {
  console.log('Starting ' + file);
  var instream = fs.createReadStream(file);
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

