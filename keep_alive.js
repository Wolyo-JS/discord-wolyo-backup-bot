var http = require('http'); 

http.createServer(function (req, res) {
res.write("bot aktif => ${client.user.tag}");
res.end();
}).listen(8080);
