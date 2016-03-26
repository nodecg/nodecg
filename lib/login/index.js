'use strict';

var path = require('path');
var express = require('express');
var app = express();
var config = require('../config').config;
var cookieParser = require('cookie-parser');
var session = require('express-session');
var NedbStore = require('express-nedb-session')(session);
var passport = require('passport');
var log = require('../logger')('nodecg/lib/login');

const protocol = config.ssl && config.ssl.enabled ? 'https' : 'http';

// 2016-03-26 - Lange: I don't know what these do?
passport.serializeUser(function (user, done) {
	done(null, user);
});
passport.deserializeUser(function (obj, done) {
	done(null, obj);
});

if (config.login.steam && config.login.steam.enabled) {
	var SteamStrategy = require('passport-steam').Strategy;
	passport.use(new SteamStrategy({
		returnURL: `${protocol}://${config.baseURL}/login/auth/steam`,
		realm: `${protocol}://${config.baseURL}/login/auth/steam`,
		apiKey: config.login.steam.apiKey
	}, function (identifier, profile, done) {
		profile.allowed = (config.login.steam.allowedIds.indexOf(profile.id) > -1);

		if (profile.allowed) {
			log.info('Granting %s (%s) access', profile.id, profile.displayName);
		} else {
			log.info('Denying %s (%s) access', profile.id, profile.displayName);
		}

		return done(null, profile);
	}));
}

if (config.login.twitch && config.login.twitch.enabled) {
	var TwitchStrategy = require('passport-twitch').Strategy;

	// The "user_read" scope is required. Add it if not present.
	var scope = config.login.twitch.scope.split(' ');
	if (scope.indexOf('user_read') < 0) {
		scope.push('user_read');
	}
	scope = scope.join(' ');

	passport.use(new TwitchStrategy({
		clientID: config.login.twitch.clientID,
		clientSecret: config.login.twitch.clientSecret,
		callbackURL: `${protocol}://${config.baseURL}/login/auth/twitch`,
		scope: scope
	}, function (accessToken, refreshToken, profile, done) {
		profile.allowed = (config.login.twitch.allowedUsernames.indexOf(profile.username) > -1);

		if (profile.allowed) {
			log.info('Granting %s access', profile.username);
			profile.accessToken = accessToken;
			// Twitch oauth does not use refreshToken
		} else {
			log.info('Denying %s access', profile.username);
		}

		return done(null, profile);
	}));
}

// express-session no longer uses cookieParser, but NodeCG's util lib does.
app.use(cookieParser(config.login.sessionSecret));
app.use(session({
	secret: config.login.sessionSecret,
	resave: false,
	saveUninitialized: false,
	store: new NedbStore({filename: path.resolve(__dirname, '../../db/sessions.db')}),
	cookie: {
		path: '/',
		httpOnly: true,
		secure: config.ssl && config.ssl.enabled
	}
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/login', express.static(path.join(__dirname, 'public')));
app.set('views', __dirname);

app.get('/login', function (req, res) {
	res.render('public/login.jade', {user: req.user, config: config});
});

app.get('/authError', function (req, res) {
	res.render('public/authError.jade', {
		message: req.query.message,
		code: req.query.code,
		viewUrl: req.query.viewUrl
	});
});

app.get('/login/steam', passport.authenticate('steam'));

app.get('/login/auth/steam',
	passport.authenticate('steam', {failureRedirect: '/login'}),
	redirectPostLogin
);

app.get('/login/twitch', passport.authenticate('twitch'));

app.get('/login/auth/twitch',
	passport.authenticate('twitch', {failureRedirect: '/login'}),
	redirectPostLogin
);

app.get('/logout', function (req, res) {
	app.emit('logout', req.session);
	req.session.destroy(function () {
		res.clearCookie('connect.sid', {path: '/'});
		res.clearCookie('socketToken', {path: '/'});
		res.redirect('/');
	});
});

function redirectPostLogin(req, res) {
	var url = req.session.returnTo || '/dashboard';
	res.redirect(url);
	app.emit('login', req.session);
}

module.exports = app;
