var fgen = require("fgen"),
    path = require("path"),
    fs = require("fs"),
    util = require("util"),
    readline = require("readline"),
    optimist = require("optimist"),
    argv = optimist
      .usage("gen bundle file [-o output]\n" +
             "gen bundle --all [-o output_dir] [--exclude=regex]")
      .alias("o", "output")
      .alias("h", "help")
      .default("o", "./")
      .describe("o", "A destination file/folder where you want to generate to.")
      .describe("all", "Generate all files, excluding those specified by 'exclude'.")
      .describe("exclude", "a regular expression pattern to exclude from generation.")
      .argv,
    homeDir, configFile, options, userOptions, templates = {}, gen, rl,
    contextFile, context, realContext, question;

if (argv.h || (argv.all && argv._.length !== 1) || (!argv.all && argv._.length !== 2)) {
  optimist.showHelp();
  process.exit(1);
}

// Default options.
options = {
  roots: [path.join(__dirname, "templates")]
};

// Read and merge user config if any.
homeDir = process.env["HOME"] || process.env["USERPROFILE"];
configFile = path.join(homeDir, ".genappconfig");
if (fs.existsSync(configFile)) {
  userOptions = JSON.parse(fs.readFile(configFile, "utf8", _));
}
if (userOptions) {
  options.roots = userOptions.roots
    .map(function(root) {
      return root.replace(/^~/, homeDir);
    })
    .concat(options.roots);
}

// Load bundles.
options.roots.forEach_(_, function(_, root) {
  if (!fs.existsSync(root)) return;

  fs.readdir(root, _)
    .filter_(_, -1, function(_, file) {
      return fs.stat(path.join(root, file), _).isDirectory();
    })
    .forEach(function(folder) {
      if (!(/^__/.test(folder) || (folder in templates))) templates[folder] = path.join(root, folder);
    });
});

// Report bundle not found error if any.
if (!(argv._[0] in templates)) {
  if (/^__/.test(argv._[0])) {
    console.log("Bundle names cannot start with '__', please choose a different name.");
  } else {
    console.log("Bundle '%s' does not exist in your current roots configuration.\n" +
                "Your current roots are:", argv._[0]);
    for (var i = 0; i < options.roots.length; i++) {
      console.log(options.roots[i]);
    }
  }
  process.exit(1);
}

contextFile = path.join(templates[argv._[0]], "..", argv._[0] + ".js");
try {
  context = require(contextFile);
} catch (ex) {
  console.log("Cannot read bundle '%s' context file.", argv._[0]);
  process.exit(1);
}

question = function(query, callback) {
  rl.question(query, function(answer) { callback(null, answer); });
};

constructContext = function(key, val, ctx, prefix, _) {
  var type, item, more = true, answer, number;

  if (Array.isArray(val)) {
    ctx[key] = [];
    console.log(util.format("ctrl+c to quit '%s'", key));
    rl.once("SIGINT", function() {
      more = false;
      rl.write(null, {ctrl: true, name: "u"});
      rl.write(null, {ctrl: true, name: "k"});
      rl.write("\n");
    });
    while (more) {
      item = {};
      ctx[key].push(item);
      Object.keys(val[0]).forEach_(_, function(_, k) {
        constructContext(k, val[0][k], item, key, _);
      });
    }
    ctx[key].length = ctx[key].length - 1;
  } else if (typeof(val) === "function") {
    ctx[key] = val;
  } else if (typeof(val) === "object" && val !== null) {
    item = {};
    ctx[key] = item;
    Object.keys(val).forEach_(_, function(_, k) {
      constructContext(k, val[k], item, key, _);
    });
  } else if (val != null) {
    type = typeof(val);
    switch (type) {
    case "string":
      answer = question((prefix ? prefix + "> " : "") + key + "? ", _);
      ctx[key] = answer;
      break;
    case "number":
      answer = question((prefix ? prefix + "> " : "") + key + "? (number)", _);
      number = parseInt(answer);
      if (isNaN(number)) {
        console.log("It's not number.");
        constructContext(key, val, ctx, prefix, _);
      } else {
        ctx[key] = number;
      }
      break;
    case "boolean":
      answer = question((prefix ? prefix + "> " : "") + key + "? (yes/no)", _).toLowerCase();
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

rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

realContext = {};
Object.keys(context.context).forEach_(_, function(_, key) {
  constructContext(key, context.context[key], realContext, null, _);
});
rl.close();
context.postProcess(realContext, _);

try {
  if (argv.all) {
    // Generate all files.
    gen = fgen.createGenerator(templates[argv._[0]], _);
    gen.context = realContext;
    if (argv.exclude != null) {
      gen.generateAll(argv.output, function(key) {
        return !(new RegExp(argv.exclude)).test(key);
      }, _);
    } else {
      gen.generateAll(argv.output, _);
    }
  } else {
    // Generate single file.
    gen = fgen.createGenerator(templates[argv._[0]], _);
    gen.context = realContext;
    gen.generate(argv._[1], argv.output, _);
  }
  console.log("done.");
} catch (e) {
  console.log();
  console.log(e.message);
}
