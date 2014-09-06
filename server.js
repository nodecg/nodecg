var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
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
app.engine('html', require('ejs').renderFile);

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

io.sockets.on('connection', function (socket) {
  socket.on('message', function (data) {
    io.sockets.json.send(data);
  });
});

server.listen(config.port);
console.log("Listening on port " + config.port);
