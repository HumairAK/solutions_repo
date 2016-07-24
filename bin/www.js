
var app = require('../app');
var http = require('http');

var server = http.createServer(app);

var io = require('socket.io')(server);

var port = '3000';
app.set('port', port);

io.on('connection', function(socket){
    console.log('a user connected');
});

server.listen(port, function(){
    console.log('listening on port 3000');
});

