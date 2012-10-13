var fs = require('fs');
var path = require('path');
var instance = require('./instance');
var platform = require('./' + process.platform);

var browsers = {
    'chrome' : {
      name : 'Google Chrome',
      regex : /chrome/i,
      type : 'webkit'
    },
    'chromium' : {
      name : 'Chromium Browser',
      regex : /chromium/i,
      type : 'webkit'
    },
    'firefox' : {
      name : 'Firefox',
      regex : /firefox/i,
      type : 'gecko'
    },
    'phantom' : {
      name : 'phantomjs',
      regex : /phantom/i,
      type : 'webkit',
      headless : true
    },
    'safari': {
      name: 'Safari',
      regex : /safari/i,
      type: 'webkit'
    },
    'ie': {
      windows: true,
      name: 'ie',
      type: 'ie'
    },
    'opera': {
        name: 'Opera',
        regex : /opera/i,
        type: 'opera'
    }
};

module.exports = function(settings, callback) {
  if(!callback) {
    callback = settings;
    settings = undefined;
  }

  var api = {
    browsers : []
  };
  var pending = Object.keys(browsers).length;

  Object.keys(browsers).forEach(function(name) {
    var browser = browsers[name];

    detect(name, function(err, version, command, process, path, defaultArgs) {
      if (err) {
        console.log(err);
      }
      else if (version) {
        api.browsers.push(merge(browser, {
          path: path || null,
          command: command || path,
          process: process || name,
          version: version,
          args: defaultArgs || []
        }));

        api[name] = function(url, options, callback) {
          if(typeof options == 'function') {
            callback = options;
            options = {};
          }

          var args = (options && options.args) ? browser.args.concat(options.args) : browser.args;
          return callback(null, instance.start(browser.command, args.concat([url]), settings, browsers[name]));
        };
      }

      if (--pending === 0) return callback(null, api);
    });
  });
};

function detect(name, callback) {
  if (platform[name]) {
    platform[name].path(function(err, path) {
      if (err) return callback(err);

      platform[name].version(function(err, version) {
        if (err) return callback(err);

        platform[name].args(function(err, defaultArgs){
          if (err) return callback(new Error('failed to get default arguments for ' + name));

          callback(err, version, platform[name].command, platform[name].process, path, defaultArgs);
        });
      });
    });
  }
  else {
      callback();
      //TODO: Could use 'which' maybe
  }
}

function merge(dest, src) {
  for (var prop in src){
    if (src[prop]) dest[prop] = src[prop];
  }

  return dest;
}