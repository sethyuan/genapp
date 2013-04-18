#!/usr/bin/env node

var fgen = require("fgen"),
    fs = require("fs"),
    fs_ = require("../lib/fs_.js"),
    path = require("path"),
    readline = require("readline"),
    nomnom = require("nomnom");

var argv = nomnom
  .script("gen")
  .options({
    bundle: {
      position: 0,
      required: true,
      help: "Bundle used for generation"
    },
    sub: {
      position: 1,
      list: true,
      help: "Sub-bundles within bundle and sub-bundles"
    },
    output: {
      abbr: "o",
      "default": "./",
      metavar: "DIR",
      help: "A destination folder where you want to generate to"
    },
    version: {
      flag: true,
      callback: function() {
        return "genapp " + require("./package.json").version;
      },
      help: "Show version"
    }
  })
  .parse();

// Default options.
var options = {
  roots: [path.join(__dirname, "bundles")]
};

var configFile = path.join(
  process.env.HOME || process.env.USERPROFILE,
  ".genappconfig"
);

// Read and merge user config if any.
if (fs_.exists(configFile, _)) {
  options.roots =
    JSON.parse(fs.readFile(configFile, "utf8", _)).roots
      .map(function(root) {
        return root.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
      })
      .concat(options.roots);
}

// Determine bundles' root.
var bundles = {};
options.roots.forEach_(_, function(_, root) {
  if (fs_.exists(root, _)) {
    return fs.readdir(root, _)
      .filter_(_, -1, function(_, file) {
        return fs.stat(path.join(root, file), _).isDirectory();
      })
      .forEach(function(folder) {
        if (!/^__/.test(folder) && !bundles[folder])
          bundles[folder] = root;
      });
  }
});

var bundle = argv._[0];

// Report bundle not found error if any.
if (!bundles[bundle]) {
  if (/^__/.test(bundle)) {
    console.log("Bundle names cannot start with '__', please choose a different name.");
  } else {
    console.log("Bundle '%s' does not exist in your current roots configuration.\n\n" +
                "Your current roots are:", bundle);
    options.roots.forEach(function(root) {
      console.log(root);
    });
  }
  process.exit(1);
}

var contextFolder = path.join(bundles[bundle], argv._.join("/___/"));

// Report sub-bundle not found if any.
if (!fs_.exists(contextFolder, _)) {
  console.log("Bundle '%s' does not exist in root '%s'.",
    argv._.join(" "), bundles[bundle]);
  process.exit(1);
}

var contextFile = path.join(contextFolder, "..", argv._[argv._.length - 1] + ".js");

// Load context file or report error if any.
try {
  var context = require(contextFile);
} catch (e) {
  console.log("Cannot read bundle '%s' context file.\n\n%s",
    argv._.join("/___/"), e);
  process.exit(1);
}

var question = function(query, callback) {
  rl.question(query, function(answer) { callback(null, answer) });
};

var constructContext = function(key, val, ctx, prefix, _) {
  if (Array.isArray(val)) {
    var more = true;
    ctx[key] = [];
    console.log("ctrl+c to quit '%s'", key);
    rl.once("SIGINT", function() {
      more = false;
      rl.write(null, {ctrl: true, name: "u"});
      rl.write(null, {ctrl: true, name: "k"});
      rl.write("\n");
    });
    while (more) {
      var item = {};
      ctx[key].push(item);
      for (var k in val[0]) {
        constructContext(k, val[0][k], item, key + "> ", _);
      }
    }
    ctx[key].length--;
  } else if (typeof val === "function") {
    ctx[key] = val;
  } else if (typeof val === "object" && val != null) {
    var item = {};
    ctx[key] = item;
    for (var k in val) {
      constructContext(k, val[k], item, key + "> ", _);
    }
  } else if (val != null) {
    switch (typeof val) {
    case "string":
      var answer = question(prefix + key + "? ", _);
      ctx[key] = answer;
      break;
    case "number":
      var answer = question(prefix + key + "? (number) ", _);
      var number = parseInt(answer);
      if (isNaN(number)) {
        console.log("It's not number.");
        constructContext(key, val, ctx, prefix, _);
      } else {
        ctx[key] = number;
      }
      break;
    case "boolean":
      var answer = question(prefix + key + "? (yes/no) ", _).toLowerCase();
      if (answer === "yes") {
        ctx[key] = true;
      } else if (answer === "no") {
        ctx[key] = false;
      } else {
        console.log("yes or no please.");
        constructContext(key, val, ctx, prefix, _);
      }
      break;
    }
  }
};

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var realContext = {};
for (var k in context.context) {
  constructContext(k, context.context[k], realContext, "", _);
}
rl.close();
if (typeof context.postProcess === "function")
  context.postProcess(realContext, _);

try {
  var gen = fgen.createGenerator(contextFolder, _);
  gen.context = realContext;
  gen.generateAll(argv.output, function(k) {
    return !/^___(\/|\\)/.test(k);
  }, _);
  console.log("done.");
} catch (e) {
  console.log();
  console.log(e.message);
}
