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
    config = require('./config'),
    chokidar = require('chokidar'),
    pkgs = readPackageManifests();

require('string.prototype.endswith');

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
 * Chokidar setup
 * Watches the "packages" folder for changes
 */
var watcher = chokidar.watch('packages/', {ignored: /[\/\\]\./, persistent: true});
// Is the below line a memory leak?
// In theory garbage collection will take care of all the now-orphaned objects on the next cycle, right?
watcher.on('all', function(path) {
  console.log("[NODECG] Change detected in packages dir, reloading all packages");
  pkgs = readPackageManifests()
  console.log("[NODECG] All packages reloaded.");
});

function readPackageManifests() {
  var packages = [];
  var packageDir = fs.readdirSync('packages/');

  packageDir.forEach(function(dir) {
    var packageName = dir;

    // Skip if nodecg.json doesn't exist
    var manifestPath = 'packages/' + packageName + '/nodecg.json';
    if (!fs.existsSync(manifestPath)) {
      return;
    }

    // Parse the JSON into a new package object
    var pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    pkg.dir = 'packages/' + pkg.name;
    pkg.admin = {}; // for some reason it wants me to initialize these
    pkg.view = {};
    pkg.admin.dir = pkg.dir + '/admin';
    pkg.view.url = 'http://' + config.host + ':' + config.port + '/view/' + pkg.name;

    // I don't like this panel implementation, but don't know how to make it better - Lange
    // Read all HTML/CSS/JS files in the package's "admin" dir into memory
    // They will then get passed to dashboard.html at the time of 'GET' and be templated into the final rendered page
    readAdminResources(pkg);

    packages.push(pkg);
  });

  return packages;
}

function readAdminResources(pkg) {
  // Why do I have to require this here? Can't I require it globally? - Lange
  require('string.prototype.endswith');

  // Array of strings containing the panel's <div>
  pkg.admin.panels = [];
  // Arrays of Objects with 'type' == 'css' or 'js', and 'text' == the CSS or JS code
  pkg.admin.resources = [];

  var adminDir = fs.readdirSync(pkg.admin.dir); // returns just the filenames of each file in the folder, not full path

  adminDir.forEach(function(file) {
    if (!fs.statSync(pkg.admin.dir + "/" + file).isFile()) {
      // Skip directories
      return;
    }

    var data = fs.readFileSync(pkg.admin.dir + "/" + file, {encoding: 'utf8'});
    if (file.endsWith('.js')) {
      pkg.admin.resources.push({type: 'js', text: data});
    } else if (file.endsWith('.css')) {
      pkg.admin.resources.push({type: 'css', text: data});
    } else if (file.endsWith('.html') || file.endsWith('.ejs')) {
      pkg.admin.panels.push(data);
    }
  });
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
