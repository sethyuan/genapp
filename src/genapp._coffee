#!/usr/bin/env node

fgen = require "fgen"
fs = require "fs"
fs_ = require "./fs_.js"
path = require "path"
util = require "util"
readline = require "readline"
nomnom = require "nomnom"

argv = nomnom
  .script("gen")
  .options
    bundle:
      position: 0
      required: true
      help: "Bundle used for generation"
    sub:
      position: 1
      list: true
      help: "Sub-bundles within bundle and sub-bundles"
    output:
      abbr: "o"
      default: "./"
      metavar: "DIR"
      help: "A destination folder where you want to generate to"
    version:
      flag: true
      callback: -> "genapp #{require("./package.json").version}"
      help: "Show version"
  .parse()

# Default options.
options =
  roots: [path.join(__dirname, "bundles")]

configFile = path.join(
  process.env["HOME"] || process.env["USERPROFILE"],
  ".genappconfig"
)

# Read and merge user config if any.
if fs_.exists(configFile, _)
  options.roots =
    JSON.parse(fs.readFile(configFile, "utf8", _)).roots
      .map((root) -> root.replace(/^~/, process.env["HOME"] || process.env["USERPROFILE"]))
      .concat(options.roots)

# Determine bundles' root.
bundles = {}
options.roots.forEach_(_, (_, root) ->
  if fs_.exists(root, _)
    fs.readdir(root, _)
      .filter_(_, -1, (_, file) -> fs.stat(path.join(root, file), _).isDirectory())
      .forEach((folder) ->
        bundles[folder] = root if !/^__/.test(folder) && !(folder of bundles)
      )
)

bundle = argv._[0]

# Report bundle not found error if any.
if !(bundle of bundles)
  if /^__/.test(bundle)
    console.log("Bundle names cannot start with '__', please choose a different name.")
  else
    console.log("""Bundle '#{bundle}' does not exist in your current roots configuration.\n
                Your current roots are:""")
    for root in options.roots
      console.log(root)
  process.exit(1)

contextFolder = path.join(bundles[bundle], argv._.join("/___/"))

# Report sub-bundle not found if any.
if !fs_.exists(contextFolder, _)
  console.log("Bundle '#{argv._.join(" ")}' does not exist in root '#{bundles[bundle]}'.")
  process.exit(1)

contextFile = path.join(contextFolder, "..", argv._[argv._.length - 1] + ".js")

# Load context file or report error if any.
try
  context = require(contextFile)
catch e
  console.log("""Cannot read bundle '#{argv._.join("/___/")}' context file.\n
              #{e}""")
  process.exit(1)

question = (query, callback) ->
  rl.question(query, (answer) -> callback(null, answer))

constructContext = (key, val, ctx, prefix, _) ->
  if Array.isArray(val)
    more = true
    ctx[key] = []
    console.log("ctrl+c to quit '#{key}'")
    rl.once("SIGINT", ->
      more = false
      rl.write(null, {ctrl: true, name: "u"})
      rl.write(null, {ctrl: true, name: "k"})
      rl.write("\n")
    )
    while more
      item = {}
      ctx[key].push(item)
      for k, v of val[0]
        constructContext(k, v, item, "#{key}> ", _)
    ctx[key].length = ctx[key].length - 1
  else if typeof val == "function"
    ctx[key] = val
  else if typeof val == "object" && val?
    item = {}
    ctx[key] = item
    for k, v of val
      constructContext(k, v, item, "#{key}> ", _)
  else if val?
    switch typeof val
      when "string"
        answer = question("#{prefix}#{key}? ", _)
        ctx[key] = answer
      when "number"
        answer = question("#{prefix}#{key}? (number) ", _)
        number = parseInt(answer)
        if isNaN(number)
          console.log("It's not number.")
          constructContext(key, val, ctx, prefix, _)
        else ctx[key] = number
      when "boolean"
        answer = question("#{prefix}#{key}? (yes/no) ", _).toLowerCase()
        if answer == "yes" then ctx[key] = true
        else if answer == "no" then ctx[key] = false
        else
          console.log("yes or no please.")
          constructContext(key, val, ctx, prefix, _)

rl = readline.createInterface(
  input: process.stdin,
  output: process.stdout
)

realContext = {}
for k, v of context.context
  constructContext(k, v, realContext, "", _)
rl.close()
context.postProcess?(realContext, _)

try
  gen = fgen.createGenerator(contextFolder, _)
  gen.context = realContext
  gen.generateAll(argv.output, (k) ->
    !/^___(\/|\\)/.test(k)
  , _)
  console.log("done.")
catch e
  console.log()
  console.log(e.message)
