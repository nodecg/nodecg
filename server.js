var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    fs = require('fs'),
    server = require('http').createServer(app),
    io = module.exports = require('socket.io').listen(server), //export our socket.io instance so modules may use it by requiring this file
    config = require('./lib/config'),
    bundles = require('./lib/bundles'),
    path = require('path');

/**
 * Express app setup
 */
app.use(express.static(__dirname + '/public'));
app.use('/components', express.static(__dirname + '/bower_components'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.engine('jade', require('jade').__express);
app.engine('html', require('ejs').renderFile);
app.engine('ejs', require('ejs').renderFile);

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

if (config.login.enabled) {
    var login = require('./lib/login');
    app.use(login);
}

var dashboard = require('./lib/dashboard');
app.use(dashboard);

var bundleViews = require('./lib/bundle_views');
app.use(bundleViews);

// Mount the NodeCG extension entrypoint fron each bundle, if any
bundles.on('allLoaded', function(allbundles) {
    allbundles.forEach(function(bundle) {
        if (!bundle.extension)
            return;

        var mainPath = path.join(__dirname, bundle.dir, bundle.extension.path);
        if (fs.existsSync(mainPath)) {
            if (bundle.extension.express) {
                app.use(require(mainPath));
                console.log('[lib/bundles/parser.js] Successfully mounted', bundle.name, 'as an express app');
            } else {
                require(mainPath);
                console.log('[lib/bundles/parser.js] Successfully mounted', bundle.name, 'as an extension');
            }
        } else {
            console.error('[lib/bundles/parser.js] Couldn\'t load bundle.main', bundle.extension.path, 'for', bundle.name, 'Skipping.');
        }
    });
});

io.set('log level', 1); // reduce logging

io.sockets.on('connection', function (socket) {
    socket.on('message', function (data) {
        io.sockets.json.send(data);
    });
});

server.listen(config.port);
console.log("Listening on port " + config.port);
