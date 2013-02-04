var exec = require("child_process").exec;

exports.context = {
  name: "",
  desc: "",
  year: function() {
    return (new Date()).getFullYear();
  },
  keywords: [
    { keyword: "" }
  ],
  user: {
    name: null,
    email: null
  }
};

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
