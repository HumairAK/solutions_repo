
var app = require('../app');
var http = require('http');

var server = http.createServer(app);

var port = '3000';
app.set('port', port);

server.listen(port, function(){
    console.log('listening on port 3000');
});

