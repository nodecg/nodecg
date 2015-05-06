'use strict';

var express = require('express');
var app = express();
var expressLess = require('express-less');
var config = require('../config').getConfig();
var cookieParser = require('cookie-parser');
var session = require('express-session');
var NedbStore = require('connect-nedb-session')(session);
var passport = require('passport');
var SteamStrategy = require('passport-steam').Strategy;
var TwitchStrategy = require('passport-twitch').Strategy;
var log = require('../logger')('nodecg/lib/login');

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

if (config.login.steam.enabled) {
    passport.use(new SteamStrategy({
            returnURL: 'http://'+ config.baseURL +'/login/auth/steam',
            realm: 'http://'+ config.baseURL +'/login/auth/steam',
            apiKey: config.login.steam.apiKey
        },
        function(identifier, profile, done) {
            process.nextTick(function() {
                profile.allowed = (config.login.steam.allowedIds.indexOf(profile.id) > -1);

                if (profile.allowed) {
                    log.info('Granting %s (%s) access', profile.id, profile.displayName);
                } else {
                    log.info('Denying %s (%s) access', profile.id, profile.displayName);
                }

                return done(null, profile);
            });
        }
    ));
}

if (config.login.twitch.enabled) {
    passport.use(new TwitchStrategy({
            clientID: config.login.twitch.clientID,
            clientSecret: config.login.twitch.clientSecret,
            callbackURL: 'http://'+ config.baseURL +'/login/auth/twitch',
            scope: config.login.twitch.scope
        },
        function(accessToken, refreshToken, profile, done) {
            process.nextTick(function() {
                profile.allowed = (config.login.twitch.allowedUsernames.indexOf(profile.username) > -1);

                if (profile.allowed) {
                    log.info('Granting %s access', profile.username);
                    profile.accessToken = accessToken;
                    // Twitch oauth does not use refreshToken
                } else {
                    log.info('Denying %s access', profile.username);
                }

                return done(null, profile);
            });
        }
    ));
}

app.use(cookieParser());
app.use(session({
    secret: config.login.sessionSecret,
    resave: true,
    saveUninitialized: true,
    store: new NedbStore({ filename: __dirname + '../../../db/sessions.db' })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/login', express.static(__dirname + '/public'));
app.use('/login', expressLess(__dirname + '/public', { compress: true }));
app.set('views', __dirname);

app.get('/login', function(req, res) {
    res.render('public/login.jade', {user: req.user, config: config});
});

app.get('/authError', function(req, res) {
    res.render('public/authError.jade', {
        message: req.query.message,
        code: req.query.code,
        viewUrl: req.query.viewUrl
    });
});

app.get('/login/steam',
    passport.authenticate('steam'),
    function() {
        // Passport will redirect to Steam to login
    }
);

app.get('/login/auth/steam',
    passport.authenticate('steam', { failureRedirect: '/login' }),
    redirectPostLogin
);

app.get('/login/twitch',
    passport.authenticate('twitch'),
    function() {
        // Passport will redirect to Twitch to login
    }
);

app.get('/login/auth/twitch',
    passport.authenticate('twitch', { failureRedirect: '/login' }),
    redirectPostLogin
);

app.get('/logout', function(req, res){
    app.emit('logout', req.session);
    req.logout();
    res.redirect('/');
});

function redirectPostLogin(req, res) {
    var url = req.session.returnTo || '/dashboard';
    res.redirect(url);
    app.emit('login', req.session);
}

module.exports = app;
