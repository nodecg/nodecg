'use strict';

const path = require('path');
const express = require('express');
const app = express();
const {config} = require('../config');
const cookieParser = require('cookie-parser');
const jsdiscordperms = require('jsdiscordperms');
const session = require('express-session');
const NedbStore = require('express-nedb-session')(session);
const passport = require('passport');
const log = require('../logger')('nodecg/lib/login');
const protocol = ((config.ssl && config.ssl.enabled) || config.login.forceHttpsReturn) ? 'https' : 'http';

// 2016-03-26 - Lange: I don't know what these do?
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (config.login.steam && config.login.steam.enabled) {
	const SteamStrategy = require('passport-steam').Strategy;
	passport.use(new SteamStrategy({
		returnURL: `${protocol}://${config.baseURL}/login/auth/steam`,
		realm: `${protocol}://${config.baseURL}/login/auth/steam`,
		apiKey: config.login.steam.apiKey
	}, (identifier, profile, done) => {
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
	const TwitchStrategy = require('passport-twitch-helix').Strategy;

	// The "user:read:email" scope is required. Add it if not present.
	let scope = config.login.twitch.scope.split(' ');
	if (scope.indexOf('user:read:email') < 0) {
		scope.push('user:read:email');
	}

	scope = scope.join(' ');

	passport.use(new TwitchStrategy({
		clientID: config.login.twitch.clientID,
		clientSecret: config.login.twitch.clientSecret,
		callbackURL: `${protocol}://${config.baseURL}/login/auth/twitch`,
		scope,
		customHeaders: {'Client-ID': config.login.twitch.clientID}
	}, (accessToken, refreshToken, profile, done) => {
		profile.allowed = (config.login.twitch.allowedUsernames.indexOf(profile.username) > -1);

		if (profile.allowed) {
			log.info('Granting %s access', profile.username);
			profile.accessToken = accessToken;
			profile.refreshToken = refreshToken;
		} else {
			log.info('Denying %s access', profile.username);
		}

		return done(null, profile);
	}));
}

if (config.login.discord && config.login.discord.enabled) {
	const DiscordStrategy = require('passport-discord').Strategy;

	// The "identify" scope is required. Add it if not present.
	let scope = config.login.discord.scope.split(' ');
	if (scope.indexOf('identify') < 0) {
		scope.push('identify');
	}

	// The "guilds" scope is required if allowedGuildIDs is used. Add it if not present.
	if (scope.indexOf('guilds') < 0 && config.login.discord.allowedGuildIDs) {
		scope.push('guilds');
	}

	scope = scope.join(' ');
	passport.use(new DiscordStrategy({
		clientID: config.login.discord.clientID,
		clientSecret: config.login.discord.clientSecret,
		callbackURL: `${protocol}://${config.baseURL}/login/auth/discord`,
		scope
	}, (accessToken, refreshToken, profile, done) => {
		if (config.login.discord.allowedUserIDs && config.login.discord.allowedUserIDs.indexOf(profile.id) > -1) {
			profile.allowed = true;
		} else if (config.login.discord.allowedGuildIDs) {
			// Filter users guilds to a list that matches requirements
			const matchingGuilds = profile.guilds.filter(guild => {
				// Optionally check that user has required permissions in guild
				if (config.login.discord.guildRequiredPermissions) {
					const convertedPermissions = jsdiscordperms.convertPerms(guild.permissions);
					// Array with all unsatisfied permission requirements for guild
					const missingPermissions = config.login.discord.guildRequiredPermissions.filter(permission => {
						// Make sure that the permission name is valid
						if (!Object.prototype.hasOwnProperty.call(convertedPermissions, permission)) {
							throw new Error(`Permission ${permission} does not seem to exist`);
						}

						return !convertedPermissions[permission];
					});
					return missingPermissions.length === 0;
				}

				return config.login.discord.allowedGuildIDs.includes(guild.id);
			});

			profile.allowed = matchingGuilds.length !== 0;
		} else {
			profile.allowed = false;
		}

		if (profile.allowed) {
			log.info('Granting %s#%s (%s) access', profile.username, profile.discriminator, profile.id);
			profile.accessToken = accessToken;
			profile.refreshToken = refreshToken;
		} else {
			log.info('Denying %s#%s (%s) access', profile.username, profile.discriminator, profile.id);
		}

		return done(null, profile);
	}));
}

if (config.login.local && config.login.local.enabled) {
	const {Strategy: LocalStrategy} = require('passport-local');
	const crypto = require('crypto');

	const {sessionSecret, local: {allowedUsers}} = config.login;
	const hashes = crypto.getHashes();

	passport.use(new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		session: false
	}, (username, password, done) => {
		const user = allowedUsers.find(u => u.username === username);
		let allowed = false;

		if (user) {
			const match = user.password.match(/^([^:]+):(.+)$/);
			let expected = user.password;
			let actual = password;

			if (match && hashes.includes(match[1])) {
				expected = match[2];
				actual = crypto
					.createHmac(match[1], sessionSecret)
					.update(actual, 'utf8')
					.digest('hex');
			}

			if (expected === actual) {
				allowed = true;
			}
		}

		log.info('%s %s access using local auth', allowed ? 'Granting' : 'Denying', username);

		return done(null, {
			provider: 'local',
			username,
			allowed
		});
	}));
}

// Express-session no longer uses cookieParser, but NodeCG's util lib does.
app.use(cookieParser(config.login.sessionSecret));
app.use(session({
	secret: config.login.sessionSecret,
	resave: false,
	saveUninitialized: false,
	store: new NedbStore({filename: path.resolve(process.env.NODECG_ROOT, 'db/sessions.db')}),
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

app.get('/login', (req, res) => {
	res.render('public/login.tmpl', {
		user: req.user,
		config
	});
});

app.get('/authError', (req, res) => {
	res.render('public/authError.tmpl', {
		message: req.query.message,
		code: req.query.code,
		viewUrl: req.query.viewUrl
	});
});

app.get('/login/steam', passport.authenticate('steam'));

app.get(
	'/login/auth/steam',
	passport.authenticate('steam', {failureRedirect: '/login'}),
	redirectPostLogin
);

app.get('/login/twitch', passport.authenticate('twitch'));

app.get(
	'/login/auth/twitch',
	passport.authenticate('twitch', {failureRedirect: '/login'}),
	redirectPostLogin
);

app.get('/login/discord', passport.authenticate('discord'));

app.get(
	'/login/auth/discord',
	passport.authenticate('discord', {failureRedirect: '/login'}),
	redirectPostLogin
);

app.get('/login/local', passport.authenticate('local'));

app.post(
	'/login/local',
	passport.authenticate('local', {failureRedirect: '/login'}),
	redirectPostLogin
);

app.get('/logout', (req, res) => {
	app.emit('logout', req.session);
	req.session.destroy(() => {
		res.clearCookie('connect.sid', {path: '/'});
		res.clearCookie('socketToken', {path: '/'});
		res.redirect('/login');
	});
});

function redirectPostLogin(req, res) {
	const url = req.session.returnTo || '/dashboard';
	res.redirect(url);
	app.emit('login', req.session);
}

module.exports = app;
