import * as path from 'node:path';
import * as crypto from 'node:crypto';

import express from 'express';
import expressSession from 'express-session';
import passport from 'passport';
import SteamStrategy from 'passport-steam';
import { Strategy as LocalStrategy } from 'passport-local';
import cookieParser from 'cookie-parser';

import { config } from '../config';
import createLogger from '../logger';
import type { User, Role } from '../database/models';
import { findUser, upsertUser, getSuperUserRole, isSuperUser } from '../database/default/utils';
import { nodecgRootPath } from '../../shared/utils/rootPath';

type StrategyDoneCb = (error: NodeJS.ErrnoException | undefined, profile?: User) => void;

/**
 * The "user profile" for Steam-authenticated users, as consumed by Express.
 */
type SteamProfile = { id: string; displayName: string };

/**
 * The "user profile" for Twitch-authenticated users, as consumed by Express.
 */
type TwitchProfile = {
	provider: 'twitch';
	id: string;
	username: string;
	displayName: string;
	email: string;
};

/**
 * The "user profile" for Discord-authenticated users, as consumed by Express.
 */
type DiscordProfile = {
	provider: 'discord';
	accessToken: string;
	username: string;
	discriminator: string;
	id: string;
	guilds: Array<{ id: string; name: string }>;
};

const log = createLogger('login');
const protocol = config.ssl?.enabled || (config.login.enabled && config.login.forceHttpsReturn) ? 'https' : 'http';

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

if (config.login.enabled && config.login.steam?.enabled && config.login.steam.apiKey) {
	const steamLoginConfig = config.login.steam;
	const apiKey = config.login.steam.apiKey;
	passport.use(
		new SteamStrategy(
			{
				returnURL: `${protocol}://${config.baseURL}/login/auth/steam`,
				realm: `${protocol}://${config.baseURL}/login/auth/steam`,
				apiKey,
			},
			async (_: unknown, profile: SteamProfile, done: StrategyDoneCb) => {
				try {
					const roles: Role[] = [];
					const allowed = steamLoginConfig?.allowedIds?.includes(profile.id);
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
				} catch (error: any) {
					done(error);
				}
			},
		),
	);
}

if (config.login.enabled && config.login.twitch?.enabled) {
	const twitchLoginConfig = config.login.twitch;
	const TwitchStrategy = require('passport-twitch-helix').Strategy;

	// The "user:read:email" scope is required. Add it if not present.
	const scopesArray = twitchLoginConfig.scope.split(' ');
	if (!scopesArray.includes('user:read:email')) {
		scopesArray.push('user:read:email');
	}

	const concatScopes = scopesArray.join(' ');

	passport.use(
		new TwitchStrategy(
			{
				clientID: twitchLoginConfig.clientID,
				clientSecret: twitchLoginConfig.clientSecret,
				callbackURL: `${protocol}://${config.baseURL}/login/auth/twitch`,
				scope: concatScopes,
				customHeaders: { 'Client-ID': twitchLoginConfig.clientID },
			},
			async (accessToken: string, refreshToken: string, profile: TwitchProfile, done: StrategyDoneCb) => {
				try {
					const roles: Role[] = [];
					const allowed =
						twitchLoginConfig.allowedUsernames?.includes(profile.username) ??
						twitchLoginConfig.allowedIds?.includes(profile.id);
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
						provider_access_token: accessToken,
						provider_refresh_token: refreshToken,
						roles,
					});
					done(undefined, user);
					return;
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

	const data = (await res.json()) as any;
	if (res.status === 200) {
		return [guild, false, data];
	}

	return [guild, true, data];
}

if (config.login.enabled && config.login.discord?.enabled) {
	const discordLoginConfig = config.login.discord;

	const DiscordStrategy = require('passport-discord').Strategy;

	// The "identify" scope is required. Add it if not present.
	const scopeArray = discordLoginConfig.scope.split(' ');
	if (!scopeArray.includes('identify')) {
		scopeArray.push('identify');
	}

	// The "guilds" scope is required if allowedGuilds are used. Add it if not present.
	if (!scopeArray.includes('guilds') && discordLoginConfig.allowedGuilds) {
		scopeArray.push('guilds');
	}

	const scope = scopeArray.join(' ');
	passport.use(
		new DiscordStrategy(
			{
				clientID: discordLoginConfig.clientID,
				clientSecret: discordLoginConfig.clientSecret,
				callbackURL: `${protocol}://${config.baseURL}/login/auth/discord`,
				scope,
			},
			async (accessToken: string, refreshToken: string, profile: DiscordProfile, done: StrategyDoneCb) => {
				if (!discordLoginConfig) {
					// Impossible but TS doesn't know that.
					done(new Error('Discord login config was impossibly undefined.'));
					return;
				}

				let allowed = false;
				if (discordLoginConfig.allowedUserIDs?.includes(profile.id)) {
					// Users that are on allowedUserIDs are allowed
					allowed = true;
				} else if (discordLoginConfig.allowedGuilds) {
					// Get guilds that are specified in the config and that user is in
					const intersectingGuilds = discordLoginConfig.allowedGuilds.filter((allowedGuild) =>
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
										`(Make sure you're using the correct bot token and guild id): ${JSON.stringify(memberResponse)}`,
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
					log.info('(Discord) Granting %s#%s (%s) access', profile.username, profile.discriminator, profile.id);
					roles.push(await getSuperUserRole());
				} else {
					log.info('(Discord) Denying %s#%s (%s) access', profile.username, profile.discriminator, profile.id);
				}

				const user = await upsertUser({
					name: `${profile.username}#${profile.discriminator}`,
					provider_type: 'discord',
					provider_hash: profile.id,
					provider_access_token: accessToken,
					provider_refresh_token: refreshToken,
					roles,
				});
				done(undefined, user);
			},
		),
	);
}

if (config.login.enabled && config.login.local?.enabled && config.login.sessionSecret) {
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
					const foundUser = allowedUsers?.find((u: { username: string; password: string }) => u.username === username);
					let allowed = false;

					if (foundUser) {
						const match = /^([^:]+):(.+)$/.exec(foundUser.password ?? '');
						let expected = foundUser.password;
						let actual = password;

						if (match && hashes.includes(match[1]!)) {
							expected = match[2]!;
							actual = crypto.createHmac(match[1]!, sessionSecret).update(actual, 'utf8').digest('hex');
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
				} catch (error: any) {
					done(error);
				}
			},
		),
	);
}

export function createMiddleware(callbacks: { onLogin(user: Express.User): void; onLogout(user: Express.User): void }) {
	const app = express();
	const redirectPostLogin = (req: express.Request, res: express.Response): void => {
		const url = req.session?.returnTo ?? '/dashboard';
		delete req.session.returnTo;
		res.redirect(url);
		app.emit('login', req.user);
		if (req.user) callbacks.onLogin(req.user);
	};

	if (!config.login.enabled || !config.login.sessionSecret) {
		throw new Error("no session secret defined, can't salt sessions, not safe, aborting");
	}

	app.use(cookieParser(config.login.sessionSecret));

	const sessionMiddleware = expressSession({
		resave: false,
		saveUninitialized: false,
		secret: config.login.sessionSecret,
		cookie: {
			path: '/',
			httpOnly: true,
			secure: config.ssl?.enabled,
		},
	});

	app.use(sessionMiddleware);

	app.use(passport.initialize());
	app.use(passport.session());

	app.use('/login', express.static(path.join(nodecgRootPath, 'dist/login')));

	app.get('/login', (req, res) => {
		// If the user is already logged in, don't show them the login page again.
		if (req.user && isSuperUser(req.user)) {
			res.redirect('/dashboard');
		} else {
			res.render(path.join(__dirname, 'views/login.tmpl'), {
				user: req.user,
				config,
			});
		}
	});

	app.get('/authError', (req, res) => {
		res.render(path.join(__dirname, 'views/authError.tmpl'), {
			message: req.query['message'],
			code: req.query['code'],
			viewUrl: req.query['viewUrl'],
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
		app.emit('logout', req.user);
		req.session?.destroy(() => {
			res.clearCookie('connect.sid', { path: '/' });
			res.clearCookie('io', { path: '/' });
			res.clearCookie('socketToken', {
				secure: req.secure,
				sameSite: req.secure ? 'none' : undefined,
			});
			res.redirect('/login');
		});
		if (req.user) callbacks.onLogout(req.user);
	});

	return { app, sessionMiddleware };
}
