var dbFile = require('../node_simple');
var app = require('../app');
/*var http = require('http');

var server = http.createServer(app);

var io = require('socket.io')(server);

var port = '3000';
app.set('port', port);

dbFile.setupDB(function (success, mssg) {
    if (success) {      // db establiseh
        server.listen(port, function(){         // now accept connections
            console.log('listening on port 3000');
        });
    }
    else {
        console.log(mssg);
    }
});


io.on('connection', function (socket) {
    socket.emit('alert', "hello from the server");
    socket.on('my other event', function (data) {
        console.log(data);
    });
});*/