#!/usr/bin/env node
'use strict';

var browserify = require('browserify');
var bundler = browserify({debug: true});
var fs = require('fs');
var path = require('path');

// BRFS throws an error during transformation when attempting to fs.readFileSync a non-existant file
// For this reason, we ensure that nodecg.json exists
if (!fs.existsSync('cfg/nodecg.json')) {
    fs.writeFileSync('cfg/nodecg.json', '{}');
}

var libPath = path.join(__dirname, '../lib/');

bundler
    .add(path.join(libPath, 'api.js'))
    .ignore(path.join(libPath, 'server/index.js'))
    .ignore(path.join(libPath, 'replicator.js'))
    .ignore(path.join(libPath, 'util.js'))
    .plugin('minifyify', {
        map: '/nodecg-api.msp.json',
        output: path.join(libPath, 'browser/public/browserifiedApi.map.json')
    })
    .transform('aliasify', {
        aliases: {
            './logger': path.join(libPath, 'browser/logger'),
            './replicant': path.join(libPath, 'browser/replicant')
        },
        verbose: false
    })
    .transform('brfs');

var wstream = fs.createWriteStream(path.join(libPath, 'browser/public/browserifiedApi.js'));
bundler.bundle()
    .on('data', function(data) {
        wstream.write(data);
    })
    .on('end', function() {
        wstream.end();
    })
    .on('error', function(err) {
        console.log(err.stack);
        process.exit(1);
    });
