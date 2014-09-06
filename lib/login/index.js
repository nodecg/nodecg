/**
 * Login page for protected views
 * Optional, see config.login.enabled
 */
var express = require('express'),
    app = module.exports = express(),
    config = require('../../config.js'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    SteamStrategy = require('passport-steam').Strategy;

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
        apiKey: config.login.steamApiKey
    },
    function(identifier, profile, done) {
        process.nextTick(function() {
            profile.identifier = identifier.substring(identifier.lastIndexOf('/') + 1);
            profile.allowed = (config.login.allowedIds.indexOf(profile.identifier) > -1);
            return done(null, profile);
        })
    }
));

app.use(cookieParser());
app.use(session({secret: config.login.sessionSecret}));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', __dirname);

app.get('/login', function(req, res) {
    res.render('login.jade', {user: req.user});
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

