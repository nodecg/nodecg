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
    gaze = require('gaze'),
    config = require('./config'),
    NcgPkg = require('./classes/ncg_pkg'),
    pkgs = parsePackages();

/**
 * Express app setup
 */
app.use(express.static(__dirname + '/public'));
app.use('/components', express.static(__dirname + '/bower_components'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
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

/**
 * Gaze setup
 * Watches the "packages" folder for changes
 */
gaze('packages/**', function(err, watcher) {
  // On changed/added/deleted
  this.on('all', function(event, filepath) {
    console.log("[NODECG] Change detected in packages dir: " + filepath + " " + event);
    console.log("[NODECG] Reloading all packages");
    pkgs = parsePackages();
    console.log("[NODECG] All packages reloaded.");
  });
});

function parsePackages() {
  var packages = [];
  var packageDir = fs.readdirSync('packages/');

  packageDir.forEach(function(dir) {
    var packageName = dir;

    // Skip if nodecg.json doesn't exist
    var pkgPath = 'packages/' + packageName + '/';
    if (!fs.existsSync(pkgPath + "nodecg.json")) {
      return;
    }

    console.log("[NODECG] Loading " + pkgPath);
    var pkg = new NcgPkg(pkgPath);

    packages.push(pkg);
  });

  return packages;
}

var viewSetupScript =
    '<script src="/socket.io/socket.io.js"></script>\r\n' +
    '<script src="/js/obsApi.js"></script>script>/r/n' +
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
  res.render('views/dashboard.html', {pkgs: pkgs, config: config});
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
