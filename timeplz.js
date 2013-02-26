var yast = require('yast'),
    argv = require('optimist').argv,
    fs = require('fs'),
    moment = require('moment'),
    async = require('async');
    require('colors');

var opts;

if (Object.keys(argv).length == 2) {
  var optsFile;
  try {
    optsFile = fs.readFileSync(__dirname + '/settings.json', 'utf8');
  } catch(e) {
    console.log("No settings specified, and no saved settings found!");
    process.exit();
  }

  opts = JSON.parse(optsFile);
} else {
  if (!argv.u || !argv.p) {
    console.log("Specify both a user (-u) and a password (-p), please!");
    process.exit();
  }

  opts = {};
  opts.user = argv.u;
  opts.pass = argv.p;
  opts.daylen = parseFloat(argv.d);
  opts.weeklen = parseInt(argv.w, 10);

  if (argv.s) {
    fs.writeFileSync(__dirname + '/settings.json', JSON.stringify(opts), 'utf8');
  }
}

yast.login(opts.user, opts.pass, function(err, user) {
  if (err) throw err;
  var startToday = moment().startOf('day');
  var endToday = moment().endOf('day');
  var startThisWeek = moment().startOf('week');
  var endThisWeek = moment().endOf('week');
  async.parallel({
    today: function(cb) {
      yast.analytics.timeSpentInPeriod(user, startToday._d, endToday._d, cb);
    },
    thisWeek: function(cb) {
      yast.analytics.timeSpentInPeriod(user, startThisWeek._d, endThisWeek._d, cb);
    }
  }, function(err, res) {
    if (err) throw err;
    
    var fmt = function(secs, col) {
      var timeString = (secs / 60 / 60).toFixed(1);
      return col ? timeString[col] : timeString;
    };

    console.log("Time spent today:", fmt(res.today[0], 'bold'), '(', 
      fmt(res.today[1], 'green'), ')');
    console.log("Time spent this week:", fmt(res.thisWeek[0], 'bold'), '(', 
      fmt(res.thisWeek[1], 'green'), ') —', (res.thisWeek[0] / 60 / 60 / opts.daylen).toFixed(1), 'days');
  });

});
