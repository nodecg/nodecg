var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    fs = require('fs'),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    config = require('./config');

/**
 * Express app setup
 */
app.use(express.static(__dirname + '/public'));
app.use('/components', express.static(__dirname + '/bower_components'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('views', './');

app.engine('jade', require('jade').__express);
app.engine('html', require('ejs').renderFile);
app.engine('ejs', require('ejs').renderFile);

app.all('*', function(req, res, next) {
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

//load and mount express apps from bundles, if they have any
var bundlesDir = fs.readdirSync('bundles/');
bundlesDir.forEach(function(bndlName) {
    // Skip if index.js doesn't exist
    var bndlPath = 'bundles/' + bndlName + '/';
    if (!fs.existsSync(bndlPath + "index.js")) {
        return;
    }

    app.use(require('./' + bndlPath + "index.js"));
    console.log('[lib/bundle/index.js] ' + bndlName + ' has an index.js, mounted');
});

io.sockets.on('connection', function (socket) {
  socket.on('message', function (data) {
    io.sockets.json.send(data);
  });
});

server.listen(config.port);
console.log("Listening on port " + config.port);
