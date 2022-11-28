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
import fetch from 'make-fetch-happen';

// Ours
import { config } from '../config';
import createLogger from '../logger';
import type { User, Role } from '../database';
import { Session, getConnection } from '../database';
import { findUser, upsertUser, getSuperUserRole, isSuperUser } from '../database/utils';

type StrategyDoneCb = (error: NodeJS.ErrnoException | undefined, profile?: User) => void;

const log = createLogger('login');
const protocol = config.ssl?.enabled ?? config.login.forceHttpsReturn ? 'https' : 'http';

// Required for persistent login sessions.
// Passport needs ability to serialize and unserialize users out of session.
passport.serializeUser<User['id']>((user, done) => {
	done(null, user.id);
});
passport.deserializeUser<User['id']>(async (id, done) => {
	try {
		done(null, await findUser(id));
	} catch (error: unknown) {
		done(error);
	}
});

if (config.login.steam?.enabled) {
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
					const allowed = config.login.steam?.allowedIds?.includes(profile.id);
					if (allowed) {
						log.info('(Steam) Granting "%s" (%s) access', profile.id, profile.displayName);
						roles.push(await getSuperUserRole());
					} else {
						log.info('(Steam) Denying "%s" (%s) access', profile.id, profile.displayName);
					}

					const user = await upsertUser({
						name: profile.displayName,
						provider_type: 'steam',
						provider_hash: profile.id,
						roles,
					});
					done(undefined, user);
					return;
					// eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
				} catch (error: any) {
					done(error);
				}
			},
		),
	);
}

if (config.login.twitch?.enabled) {
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
					const allowed =
						config.login.twitch?.allowedUsernames?.includes(profile.username) ??
						config.login.twitch?.allowedIds?.includes(profile.id);
					if (allowed) {
						log.info('(Twitch) Granting %s access', profile.username);
						roles.push(await getSuperUserRole());
					} else {
						log.info('(Twitch) Denying %s access', profile.username);
					}

					const user = await upsertUser({
						name: profile.displayName,
						provider_type: 'twitch',
						provider_hash: profile.id,
						roles,
					});
					done(undefined, user);
					return;
					// eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
				} catch (error: any) {
					done(error);
				}
			},
		),
	);
}

async function makeDiscordAPIRequest(
	guild: { guildID: string; guildBotToken: string; allowedRoleIDs: string[] },
	userID: string,
): Promise<[{ guildID: string; guildBotToken: string; allowedRoleIDs: string[] }, boolean, { roles: string[] }]> {
	const res = await fetch(`https://discord.com/api/v8/guilds/${guild.guildID}/members/${userID}`, {
		headers: {
			Authorization: `Bot ${guild.guildBotToken}`,
		},
	});
	const data = await res.json();
	if (res.status === 200) {
		return [guild, false, data];
	}

	return [guild, true, data];
}

if (config.login.discord?.enabled) {
	const DiscordStrategy = require('passport-discord').Strategy;

	// The "identify" scope is required. Add it if not present.
	const scopeArray = config.login.discord.scope.split(' ');
	if (!scopeArray.includes('identify')) {
		scopeArray.push('identify');
	}

	// The "guilds" scope is required if allowedGuilds are used. Add it if not present.
	if (!scopeArray.includes('guilds') && config.login.discord.allowedGuilds) {
		scopeArray.push('guilds');
	}

	const scope = scopeArray.join(' ');
	passport.use(
		new DiscordStrategy(
			{
				clientID: config.login.discord.clientID,
				clientSecret: config.login.discord.clientSecret,
				callbackURL: `${protocol}://${config.baseURL}/login/auth/discord`,
				scope,
			},
			async (
				_accessToken: string,
				_refreshToken: string,
				profile: {
					provider: 'discord';
					accessToken: string;
					username: string;
					discriminator: string;
					id: string;
					guilds: Array<{ id: string; name: string }>;
				},
				done: StrategyDoneCb,
			) => {
				if (!config.login.discord) {
					// Impossible but TS doesn't know that.
					done(new Error('Discord login config was impossibly undefined.'));
					return;
				}

				let allowed = false;
				if (config.login.discord.allowedUserIDs?.includes(profile.id)) {
					// Users that are on allowedUserIDs are allowed
					allowed = true;
				} else if (config.login.discord.allowedGuilds) {
					// Get guilds that are specified in the config and that user is in
					const intersectingGuilds = config.login.discord.allowedGuilds.filter((allowedGuild) =>
						profile.guilds.some((profileGuild) => profileGuild.id === allowedGuild.guildID),
					);

					const guildRequests = [];

					for (const intersectingGuild of intersectingGuilds) {
						if (!intersectingGuild.allowedRoleIDs || intersectingGuild.allowedRoleIDs.length === 0) {
							// If the user matches any guilds that only have member and not role requirements we do not need to make requests to the discord API
							allowed = true;
						} else {
							// Queue up all requests to the Discord API to improve speed
							guildRequests.push(makeDiscordAPIRequest(intersectingGuild, profile.id));
						}
					}

					if (!allowed) {
						const guildsData = await Promise.all(guildRequests);
						for (const [guildWithRoles, err, memberResponse] of guildsData) {
							if (err) {
								log.warn(
									`Got error while trying to get guild ${guildWithRoles.guildID} ` +
										`(Make sure you're using the correct bot token and guild id): ${JSON.stringify(
											memberResponse,
										)}`,
								);
								continue;
							}

							const intersectingRoles = guildWithRoles.allowedRoleIDs.filter((allowedRole) =>
								memberResponse.roles.includes(allowedRole),
							);
							if (intersectingRoles.length > 0) {
								allowed = true;
								break;
							}
						}
					}
				} else {
					allowed = false;
				}

				const roles: Role[] = [];
				if (allowed) {
					log.info(
						'(Discord) Granting %s#%s (%s) access',
						profile.username,
						profile.discriminator,
						profile.id,
					);
					roles.push(await getSuperUserRole());
				} else {
					log.info(
						'(Discord) Denying %s#%s (%s) access',
						profile.username,
						profile.discriminator,
						profile.id,
					);
				}

				const user = await upsertUser({
					name: `${profile.username}#${profile.discriminator}`,
					provider_type: 'discord',
					provider_hash: profile.id,
					roles,
				});
				done(undefined, user);
			},
		),
	);
}

if (config.login.local?.enabled) {
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
					const foundUser = allowedUsers?.find(
						(u: { username: string; password: string }) => u.username === username,
					);
					let allowed = false;

					if (foundUser) {
						const match = /^([^:]+):(.+)$/.exec(foundUser.password ?? '');
						let expected = foundUser.password;
						let actual = password;

						if (match && hashes.includes(match[1])) {
							expected = match[2];
							actual = crypto.createHmac(match[1], sessionSecret).update(actual, 'utf8').digest('hex');
						}

						if (expected === actual) {
							allowed = true;
							roles.push(await getSuperUserRole());
						}
					}

					log.info('(Local) %s "%s" access', allowed ? 'Granting' : 'Denying', username);

					const user = await upsertUser({
						name: username,
						provider_type: 'local',
						provider_hash: username,
						roles,
					});
					done(undefined, user);
					return;
					// eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
				} catch (error: any) {
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
		const url = req.session?.returnTo ?? '/dashboard';
		delete req.session.returnTo;
		res.redirect(url);
		app.emit('login', req.session);
	};

	if (!config.login.sessionSecret) {
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
				secure: config.ssl?.enabled,
			},
		}),
	);

	app.use(passport.initialize());
	app.use(passport.session());

	const VIEWS_DIR = path.join(appRootPath.path, 'src/server/login/views');

	app.use('/login', express.static(path.join(appRootPath.path, 'build/client/login')));
	app.set('views', VIEWS_DIR);

	app.get('/login', (req, res) => {
		// If the user is already logged in, don't show them the login page again.
		if (req.user && isSuperUser(req.user)) {
			res.redirect('/dashboard');
		} else {
			res.render(path.join(VIEWS_DIR, 'login.tmpl'), {
				user: req.user,
				config,
			});
		}
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

	app.get('/login/discord', passport.authenticate('discord'));

	app.get('/login/auth/discord', passport.authenticate('discord', { failureRedirect: '/login' }), redirectPostLogin);

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
				secure: config.ssl?.enabled,
			});
			res.redirect('/login');
		});
	});

	return app;
}
