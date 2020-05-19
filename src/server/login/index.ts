// Native
import path from 'path';
import crypto from 'crypto';

// Packages
import express from 'express';
import expressSession from 'express-session';
import passport from 'passport';
import steamStrategy from 'passport-steam';
import { Strategy as LocalStrategy } from 'passport-local';
import { TypeormStore } from 'connect-typeorm';
import cookieParser from 'cookie-parser';
import appRootPath from 'app-root-path';

// Ours
import { config } from '../config';
import createLogger from '../logger';
import { User, Session, Role, getConnection } from '../database';
import { findUser, upsertUser, getSuperUserRole } from '../database/utils';

type StrategyDoneCb = (error: NodeJS.ErrnoException | null, profile?: User) => void;

const log = createLogger('nodecg/lib/login');
const protocol = (config.ssl && config.ssl.enabled) || config.login?.forceHttpsReturn ? 'https' : 'http';

// Required for persistent login sessions.
// Passport needs ability to serialize and unserialize users out of session.
passport.serializeUser<User, User['id']>((user, done) => done(null, user.id));
passport.deserializeUser<User, User['id']>(async (id, done) => {
	try {
		done(null, await findUser(id));
	} catch (error) {
		done(error);
	}
});

if (config?.login?.steam?.enabled) {
	passport.use(
		steamStrategy(
			{
				returnURL: `${protocol}://${config.baseURL}/login/auth/steam`,
				realm: `${protocol}://${config.baseURL}/login/auth/steam`,
				apiKey: config.login.steam.apiKey,
			},
			async (
				_: unknown,
				profile: { id: string; allowed: boolean; displayName: string },
				done: StrategyDoneCb,
			) => {
				try {
					const roles: Role[] = [];
					const allowed = config.login?.steam?.allowedIds?.includes(profile.id);
					if (allowed) {
						log.info('Granting "%s" (%s) access', profile.id, profile.displayName);
						roles.push(await getSuperUserRole());
					} else {
						log.info('Denying "%s" (%s) access', profile.id, profile.displayName);
					}

					const user = await upsertUser({
						name: profile.displayName,
						provider_type: 'steam',
						provider_hash: profile.id,
						roles,
					});
					return done(null, user);
				} catch (error) {
					done(error);
				}
			},
		),
	);
}

if (config?.login?.twitch?.enabled) {
	const TwitchStrategy = require('passport-twitch-helix').Strategy;

	// The "user:read:email" scope is required. Add it if not present.
	const scopesArray = config.login.twitch.scope.split(' ');
	if (!scopesArray.includes('user:read:email')) {
		scopesArray.push('user:read:email');
	}

	const concatScopes = scopesArray.join(' ');

	passport.use(
		new TwitchStrategy(
			{
				clientID: config.login.twitch.clientID,
				clientSecret: config.login.twitch.clientSecret,
				callbackURL: `${protocol}://${config.baseURL}/login/auth/twitch`,
				scope: concatScopes,
				customHeaders: { 'Client-ID': config.login.twitch.clientID },
			},
			async (
				_accessToken: string,
				_refreshToken: string,
				profile: { provider: 'twitch'; id: string; username: string; displayName: string; email: string },
				done: StrategyDoneCb,
			) => {
				try {
					const roles: Role[] = [];
					const allowed = config.login?.twitch?.allowedUsernames?.includes(profile.username);
					if (allowed) {
						log.info('Granting %s access', profile.username);
						roles.push(await getSuperUserRole());
					} else {
						log.info('Denying %s access', profile.username);
					}

					const user = await upsertUser({
						name: profile.displayName,
						provider_type: 'twitch',
						provider_hash: profile.id,
						roles,
					});
					return done(null, user);
				} catch (error) {
					done(error);
				}
			},
		),
	);
}

if (config.login?.local?.enabled) {
	const {
		sessionSecret,
		local: { allowedUsers },
	} = config.login;
	const hashes = crypto.getHashes();

	passport.use(
		new LocalStrategy(
			{
				usernameField: 'username',
				passwordField: 'password',
				session: false,
			},
			async (username: string, password: string, done: StrategyDoneCb) => {
				try {
					const roles: Role[] = [];
					const foundUser = allowedUsers?.find(u => u.username === username);
					let allowed = false;

					if (foundUser) {
						const match = /^([^:]+):(.+)$/.exec(foundUser.password ?? '');
						let expected = foundUser.password;
						let actual = password;

						if (match && hashes.includes(match[1])) {
							expected = match[2];
							actual = crypto
								.createHmac(match[1], sessionSecret!)
								.update(actual, 'utf8')
								.digest('hex');
						}

						if (expected === actual) {
							allowed = true;
							roles.push(await getSuperUserRole());
						}
					}

					log.info('%s "%s" access using local auth', allowed ? 'Granting' : 'Denying', username);

					const user = await upsertUser({
						name: username,
						provider_type: 'local',
						provider_hash: username,
						roles,
					});
					return done(null, user);
				} catch (error) {
					done(error);
				}
			},
		),
	);
}

export async function createMiddleware(): Promise<express.Application> {
	const database = await getConnection();
	const sessionRepository = database.getRepository(Session);
	const app = express();
	const redirectPostLogin = (req: express.Request, res: express.Response): void => {
		const url = req.session?.returnTo || '/dashboard';
		res.redirect(url);
		app.emit('login', req.session);
	};

	if (!config.login?.sessionSecret) {
		throw new Error("no session secret defined, can't salt sessions, not safe, aborting");
	}

	app.use(cookieParser(config.login.sessionSecret));

	app.use(
		expressSession({
			resave: false,
			saveUninitialized: false,
			store: new TypeormStore({
				cleanupLimit: 2,
				ttl: Infinity,
			}).connect(sessionRepository),
			secret: config.login.sessionSecret,
			cookie: {
				path: '/',
				httpOnly: true,
				secure: config.ssl && config.ssl.enabled,
			},
		}),
	);

	app.use(passport.initialize());
	app.use(passport.session());

	const VIEWS_DIR = path.join(appRootPath.path, 'src/server/login/views');

	app.use('/login', express.static(path.join(appRootPath.path, 'build/client/login')));
	app.set('views', VIEWS_DIR);

	app.get('/login', (req, res) => {
		res.render(path.join(VIEWS_DIR, 'login.tmpl'), {
			user: req.user,
			config,
		});
	});

	app.get('/authError', (req, res) => {
		res.render(path.join(VIEWS_DIR, 'authError.tmpl'), {
			message: req.query.message,
			code: req.query.code,
			viewUrl: req.query.viewUrl,
		});
	});

	app.get('/login/steam', passport.authenticate('steam'));

	app.get('/login/auth/steam', passport.authenticate('steam', { failureRedirect: '/login' }), redirectPostLogin);

	app.get('/login/twitch', passport.authenticate('twitch'));

	app.get('/login/auth/twitch', passport.authenticate('twitch', { failureRedirect: '/login' }), redirectPostLogin);

	app.get('/login/local', passport.authenticate('local'));

	app.post('/login/local', passport.authenticate('local', { failureRedirect: '/login' }), redirectPostLogin);

	app.get('/logout', (req, res) => {
		app.emit('logout', req.session);
		req.session?.destroy(() => {
			// To set a cookie on localhost, domain must be left blank
			let domain: string | undefined = config.baseURL.replace(/:[0-9]+/, '');
			if (domain === 'localhost') {
				domain = undefined;
			}

			res.clearCookie('connect.sid', { path: '/' });
			res.clearCookie('io', { path: '/' });
			res.clearCookie('socketToken', {
				path: '/',
				domain,
				secure: config.ssl && config.ssl.enabled,
			});
			res.redirect('/login');
		});
	});

	return app;
}
