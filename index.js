'use strict';

var server = require('./lib/server');

server.on('error', function() {
    process.exit(1);
});

server.on('stopped', function() {
    process.exit(0);
});

server.start();
