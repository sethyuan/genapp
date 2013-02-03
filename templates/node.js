exports.context = {
  name: "",
  desc: "",
  version: "",
  year: function() {
    return (new Date()).getFullYear();
  },
  keywords: [
    { keyword: "" }
  ]
};

exports.postProcess = function(context) {
  if (context.keywords && context.keywords.length > 0) {
    context.keywords[context.keywords.length - 1].last = true;
  }
};
