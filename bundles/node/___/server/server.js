var http = require("http"),
    server = http.createServer();

server.on("request", function(req, res) {
  res.writeHead(200, {"Content-Type": "text/plain", "Content-Length": 2});
  res.end("OK");
});

server.listen({{port}}, function() {
  console.log("Listening on port {{port}}.");
});
