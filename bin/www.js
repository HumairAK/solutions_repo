#!/usr/bin/env node
var app = require('../app');
var http = require('http');

var port = '3000';
app.set('port', port);

var server = http.createServer(app);

server.listen(port, function(){
    console.log('listening on port 3000');
});

