var exec = require("child_process").exec;

exports.context = {
  name: "",
  desc: "",
  version: "",
  year: function() {
    return (new Date()).getFullYear();
  },
  keywords: [
    { keyword: "" }
  ],
  user: {
    name: (function() {
      var userName;
      exec("git config --get user.name", function(err, stdout, stderr) {
        userName = (err ? "" : stdout.trim());
      });
      return function() {
        return userName;
      };
    }()),
    email: (function() {
      var email;
      exec("git config --get user.email", function(err, stdout, stderr) {
        email = (err ? "" : stdout.trim());
      });
      return function() {
        return email;
      };
    }())
  }
};

exports.postProcess = function(context) {
  if (context.keywords && context.keywords.length > 0) {
    context.keywords[context.keywords.length - 1].last = true;
  }
};
