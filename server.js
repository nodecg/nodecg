var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    file = require('file'),
    fs = require('fs'),
    passport = require('passport'),
    SteamStrategy = require('passport-steam').Strategy,
    config = require('./config');

require('string.prototype.endswith');

/**
 * Express app setup
 */
app.use(express.static(__dirname + '/public'));
app.use('/components', express.static(__dirname + '/bower_components'));
app.use(bodyParser({strict: false}));
app.set('views', './');
app.engine('html', require('ejs').renderFile);

if (config.login.enabled) {
  app.use(cookieParser());
  app.use(session({secret: config.login.sessionSecret}));
  app.use(passport.initialize());
  app.use(passport.session());
}

/**
 * Passport setup
 * Serializing full user profile, setting up SteamStrategy
 */
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new SteamStrategy({
    returnURL: config.login.steamReturnURL,
    realm: config.login.steamReturnURL,
    apiKey: config.login.apiKey
  },
  function(identifier, profile, done) {
    process.nextTick(function() {
      profile.identifier = identifier.substring(identifier.lastIndexOf('/') + 1);
      profile.allowed = (config.login.allowedIds.indexOf(profile.identifier) > -1);
      return done(null, profile);
    })
  }
));

function readAdminResources() {
  // Array of strings containing the panel's <div>
  var adminPanels = [];
  // Arrays of Objects with 'type' == 'css' or 'js', and 'text' == the CSS or JS code
  var adminResources = [];

  var packageDir = fs.readdirSync('packages/');
  for (var i = 0; i < packageDir.length; i++) {
    var packageName = packageDir[i];

    // Skip if not a directory
    if (!fs.statSync('packages/' + packageName).isDirectory()) {
      continue;
    }

    var adminDir = fs.readdirSync('packages/' + packageName + '/admin/');
    for (var j = 0; j < adminDir.length; j++) {
      var adminContentFilename = adminDir[j];
      if (!fs.statSync('packages/' + packageName + '/admin/' + adminContentFilename).isFile()) {
        // Skip directories
        continue;
      }

      var data = fs.readFileSync('packages/' + packageName + '/admin/' + adminContentFilename, {encoding: 'utf8'});
      if (adminContentFilename.endsWith('.js')) {
        adminResources.push({packageName: packageName, type: 'js', text: data});
      } else if (adminContentFilename.endsWith('.css')) {
        adminResources.push({packageName: packageName, type: 'css', text: data});
      } else if (adminContentFilename.endsWith('.html') || adminContentFilename.endsWith('.ejs')) {
        adminPanels.push(data);
      }
    }
  }

  return {panels: adminPanels, resources: adminResources};
}

var viewSetupScript =
    '<script src="/socket.io/socket.io.js"></script>\r\n' +
    '<script>window.__ncg__packagename__ = \'PACKAGENAME\';</script>' +
    '<script src="/nodecg.js"></script>';

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/view/:view_name*', function(req, res) {
  var viewName = req.param('view_name');

  var resName = 'index.html';
  if (!req.params[0]) {
    res.redirect(req.url + '/');
  }

  if (req.params[0] != '/' && req.params[0] != '//') {
    resName = req.params[0].substr(1);
  }

   var fileLocation = 'packages/' + viewName + '/view/' + resName;

  // Check if the file exists
  if (!fs.existsSync(fileLocation)) {
    res.status(404).send('Unable to find '+ viewName +'/'+ resName);
  }

  if (resName.endsWith('html') || resName.endsWith('ejs')) {
    res.render(fileLocation, {setupScript: viewSetupScript.replace('PACKAGENAME', viewName)});
  } else {
    res.sendfile(fileLocation);
  }
});

app.get('/', function(req, res) {
  res.redirect('/dashboard');
});

app.get('/dashboard', ensureAuthenticated, function(req, res) {
  var resources = readAdminResources();

  res.render('views/dashboard.html', {resources: resources.resources, panels: resources.panels, config: config});
});

app.get('/nodecg.js', function(req, res) {
  res.render('views/js/nodecg.ejs', {host: config.host, port: config.port})
});

/**
 * Login page for protected views
 * Optional, see config.login.enabled
 */
app.get('/login', function(req, res) {
  res.render('views/login.html', {user: req.user});
});
app.get('/login/steam',
  passport.authenticate('steam'),
  function(req, res) {
    // Passport will redirect to Steam to login
  }
);
app.get('/login/auth',
  passport.authenticate('steam', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/dashboard');
  }
);

function ensureAuthenticated(req, res, next) {
  if (!config.login.enabled)
    return next();

  var allowed = false;
  if (req.user !== undefined)
    allowed = req.user.allowed;

  if (req.isAuthenticated() && allowed)
    return next();

  res.redirect('/login');
}

io.sockets.on('connection', function (socket) {
  socket.on('message', function (data) {
    io.sockets.json.send(data);
  });
});

server.listen(config.port);
console.log("Listening on port " + config.port);
