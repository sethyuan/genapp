// Generated by CoffeeScript 1.4.0
var fs;

fs = require("fs");

exports.exists = function(path, callback) {
  return fs.exists(path, function(exists) {
    return callback(null, exists);
  });
};
