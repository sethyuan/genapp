var fs = require("fs");

exports.exists = function(path, callback) {
  return fs.exists(path, function(exists) {
    return callback(null, exists);
  });
};
