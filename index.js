'use strict';

if (process.cwd() !== __dirname) {
    console.warn('[nodecg] process.cwd is %s, expected %s', process.cwd(), __dirname);
    console.info('[nodecg] Changed process.cwd to %s', __dirname);
    process.chdir(__dirname);
}

process.on('uncaughtException', function(err) {
    console.error('UNCAUGHT EXCEPTION! NodeCG will now exit.');
    console.error(err.stack);
    process.exit(1);
});

var server = require('./lib/server')
    .on('error', function() {
        process.exit(1);
    })
    .on('stopped', function() {
        process.exit(0);
    });

server.start();
