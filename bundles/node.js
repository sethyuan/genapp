// require exec because we're gonna use it later.
// If you want to require a third-party module, you can place it
// alongside this js file, but renamed it so it starts with double
// underscore and do a relative path require, like this:
// 
// var mymodule = require("./__mymodule");
//
// Folders starting with double underscores are ignored by genapp.
var exec = require("child_process").exec;

// Define all properties needed by the templates, a value of
// "" means this property is a string
// 0 means this property is a number
// false means this property is a boolean
// null means this property's value is given in postProcess
// function means this property is a lambda that gets called
exports.context = {
  name: "",
  desc: "",
  year: function() {
    return (new Date()).getFullYear();
  },
  keywords: [
    { keyword: "" }
  ],
  json: function() { return "json" },
  user: {
    name: null,
    email: null
  }
};

// postProcess is called after user's input.
exports.postProcess = function(context, callback) {
  if (context.keywords && context.keywords.length > 0) {
    context.keywords[context.keywords.length - 1].last = true;
  }

  // Because of exec's async nature, we have to call them here.
  // Hogan does not support async lambdas.
  exec("git config --get user.name", function(err, stdout, stderr) {
    context.user.name = (err ? "" : stdout.trim());
    exec("git config --get user.email", function(err, stdout, stderr) {
      context.user.email = (err ? "" : stdout.trim());
      callback();
    });
  });
};
