'use strict';

if (process.cwd() !== __dirname) {
    console.warn('[nodecg] process.cwd is %s, expected %s', process.cwd(), __dirname);
    process.chdir(__dirname);
    console.info('[nodecg] Changed process.cwd to %s', __dirname);
}

var semver = require('semver');
if (!semver.satisfies(process.version.substr(1), '>=4')) {
    console.warn('WARNING: NodeCG requires Node.js >=4 and npm >=2\n\t',
     'Your Node.js version:', process.version);
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
