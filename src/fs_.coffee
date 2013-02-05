fs = require("fs")

exports.exists = (path, callback) ->
  fs.exists(path, (exists) -> callback(null, exists))
