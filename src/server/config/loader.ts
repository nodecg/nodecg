// Native
import fs from 'fs';
import path from 'path';

// Packages
import { klona as clone } from 'klona/json';
import Joi from 'joi';
import { cosmiconfigSync as cosmiconfig } from 'cosmiconfig';
import { argv } from 'yargs';

// Ours
import { LogLevel } from '../../shared/logger-interface';
import type { NodeCG } from '../../types/nodecg';

function getConfigSchema(userConfig: Record<string, any>) {
	return Joi.object({
		host: Joi.string().default('0.0.0.0').description('The IP address or hostname that NodeCG should bind to.'),

		port: Joi.number().port().default(9090).description('The port that NodeCG should listen on.'),

		baseURL: Joi.string()
			.default('')
			.description(
				'The URL of this instance. Used for things like cookies. Defaults to HOST:PORT. ' +
					"If you use a reverse proxy, you'll likely need to set this value.",
			),

		exitOnUncaught: Joi.boolean().default(true).description('Whether or not to exit on uncaught exceptions.'),

		logging: Joi.object({
			console: Joi.object({
				enabled: Joi.boolean().default(true).description('Whether to enable console logging.'),

				level: Joi.string()
					.valid(...Object.values(LogLevel))
					.default('info'),

				timestamps: Joi.boolean()
					.default(true)
					.description('Whether to add timestamps to the console logging.'),

				replicants: Joi.boolean()
					.default(false)
					.description('Whether to enable logging of the Replicants subsystem. Very spammy.'),
			}).default(),

			file: Joi.object({
				enabled: Joi.boolean().default(false).description('Whether to enable file logging.'),
				level: Joi.string()
					.valid(...Object.values(LogLevel))
					.default('info'),

				path: Joi.string().default('logs/nodecg.log').description('The filepath to log to.'),

				timestamps: Joi.boolean().default(true).description('Whether to add timestamps to the file logging.'),

				replicants: Joi.boolean()
					.default(false)
					.description('Whether to enable logging of the Replicants subsystem. Very spammy.'),
			}).default(),
		}).default(),

		bundles: Joi.object({
			enabled: Joi.array()
				.items(Joi.string())
				.allow(null)
				.default(argv['bundlesEnabled'] ?? null)
				.description('A whitelist array of bundle names that will be the only ones loaded at startup.'),

			disabled: Joi.array()
				.items(Joi.string())
				.allow(null)
				.default(argv['bundlesDisabled'] ?? null)
				.description('A blacklist array of bundle names that will be excluded from loading at startup.'),

			paths: Joi.array()
				.items(Joi.string())
				.default(argv['bundlesPaths'] ?? [])
				.description('An array of additional paths where bundles are located.'),
		}).default({
			enabled: null,
			disabled: null,
			paths: [],
		}),

		login: Joi.object({
			enabled: Joi.boolean().default(false).description('Whether to enable login security.'),
			sessionSecret: Joi.string()
				// This will throw if the user does not provide a value, but only if login security is enabled.
				.default(userConfig?.['login']?.enabled ? null : 'insecureButUnused')
				.description('The secret used to salt sessions.'),
			forceHttpsReturn: Joi.boolean()
				.default(false)
				.description(
					'Forces Steam & Twitch login return URLs to use HTTPS instead of HTTP. Useful in reverse proxy setups.',
				),
			steam: Joi.object({
				enabled: Joi.boolean().default(false).description('Whether to enable Steam authentication.'),
				apiKey: Joi.string()
					// This will throw if the user does not provide a value, but only if Steam auth is enabled.
					.default(userConfig?.['login']?.steam?.enabled ? null : '')
					.description('A Steam API Key. Obtained from http://steamcommunity.com/dev/apikey'),
				allowedIds: Joi.array()
					.items(Joi.string())
					// This will throw if the user does not provide a value, but only if Steam auth is enabled.
					.default(userConfig?.['login']?.steam?.enabled ? null : [])
					.description('Which 64 bit Steam IDs to allow. Can be obtained from https://steamid.io/'),
			}),

			twitch: Joi.object({
				enabled: Joi.boolean().default(false).description('Whether to enable Twitch authentication.'),
				clientID: Joi.string()
					// This will throw if the user does not provide a value, but only if Twitch auth is enabled.
					.default(userConfig?.['login']?.twitch?.enabled ? null : '')
					.description('A Twitch application ClientID http://twitch.tv/kraken/oauth2/clients/new'),
				clientSecret: Joi.string()
					// This will throw if the user does not provide a value, but only if Twitch auth is enabled.
					.default(userConfig?.['login']?.twitch?.enabled ? null : '')
					.description('A Twitch application ClientSecret http://twitch.tv/kraken/oauth2/clients/new'),
				scope: Joi.string()
					.default('user_read')
					.description('A space-separated string of Twitch application permissions.'),
				allowedUsernames: Joi.array()
					.items(Joi.string())
					// This will throw if the user does not provide a value and is not using allowedIds, but only if Twitch auth is enabled.
					.default(
						userConfig?.['login']?.twitch?.enabled && !userConfig?.['']?.twitch?.allowedIds ? null : [],
					)
					.description('Which Twitch usernames to allow.'),
				allowedIds: Joi.array()
					.items(Joi.string())
					// This will throw if the user does not provide a value and is not using allowedUsernames, but only if Twitch auth is enabled.
					.default(
						userConfig?.['login']?.twitch?.enabled && !userConfig?.['']?.twitch?.allowedUsernames
							? null
							: [],
					)
					.description(
						'Which Twitch IDs to allow. Can be obtained from https://twitchinsights.net/checkuser',
					),
			}),

			discord: Joi.object({
				enabled: Joi.boolean().default(false).description('Whether to enable Discord authentication.'),
				clientID: Joi.string()
					// This will throw if the user does not provide a value, but only if Discord auth is enabled.
					.default(userConfig?.['login']?.discord?.enabled ? null : '')
					.description('A Discord application ClientID https://discord.com/developers/applications'),
				clientSecret: Joi.string()
					// This will throw if the user does not provide a value, but only if Discord auth is enabled.
					.default(userConfig?.['login']?.discord?.enabled ? null : '')
					.description('A Discord application ClientSecret https://discord.com/developers/applications'),
				scope: Joi.string()
					.default('identify')
					.description(
						'A space-separated string of Discord application scopes. https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes',
					),
				allowedUserIDs: Joi.array()
					.items(Joi.string())
					// This will throw if the user does not provide a value and is not using allowedGuilds, but only if Discord auth is enabled.
					.default(
						userConfig?.['login']?.discord?.enabled && !userConfig?.['login']?.discord?.allowedGuilds
							? null
							: [],
					)
					.description('Which Discord user IDs to allow.'),
				allowedGuilds: Joi.array()
					.items(
						Joi.object({
							guildID: Joi.string().description('Users in this Discord Server are allowed to log in.'),
							allowedRoleIDs: Joi.array()
								.items(Joi.string())
								.default([])
								.description('Additionally require one of the roles on the server to log in.'),
							guildBotToken: Joi.string()
								.default('')
								.description('Discord bot token, needed if allowedRoleIDs is used.'),
						}),
					)
					// This will throw if the user does not provide a value and is not using allowedUserIDs, but only if Discord auth is enabled.
					.default(
						userConfig?.['login']?.discord?.enabled && !userConfig?.['login']?.discord?.allowedUserIDs
							? null
							: [],
					),
			}),

			local: Joi.object({
				enabled: Joi.boolean().default(false).description('Enable Local authentication.'),
				allowedUsers: Joi.array()
					.items(
						Joi.object({
							username: Joi.string(),
							password: Joi.string(),
						}),
					)
					// This will throw if the user does not provide a value, but only if Local auth is enabled.
					.default(userConfig?.['login']?.local?.enabled ? null : [])
					.description('Which users can log in.'),
			}),
		}).default(),

		ssl: Joi.object({
			enabled: Joi.boolean().default(false).description('Whether to enable SSL/HTTPS encryption.'),
			allowHTTP: Joi.boolean()
				.default(false)
				.description('Whether to allow insecure HTTP connections while SSL is active.'),
			keyPath: Joi.string()
				// This will throw if the user does not provide a value, but only if SSL is enabled.
				.default(userConfig?.['ssl']?.enabled ? null : '')
				.description('The path to an SSL key file.'),
			certificatePath: Joi.string()
				// This will throw if the user does not provide a value, but only if SSL is enabled.
				.default(userConfig?.['ssl']?.enabled ? null : '')
				.description('The path to an SSL certificate file.'),
			passphrase: Joi.string().description('The passphrase for the provided key file.').optional(),
		}).optional(),

		sentry: Joi.object({
			enabled: Joi.boolean().default(false).description('Whether to enable Sentry error reporting.'),
			dsn: Joi.string()
				// This will throw if the user does not provide a value, but only if Sentry is enabled.
				.default(userConfig?.['sentry']?.enabled ? null : '')
				.description("Your project's DSN, used to route alerts to the correct place."),
		}).optional(),
	});
}

export default function (cfgDirOrFile: string) {
	let isFile = false;
	try {
		isFile = fs.lstatSync(cfgDirOrFile).isFile();
	} catch (error: any) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}

	const cfgDir = isFile ? path.dirname(cfgDirOrFile) : cfgDirOrFile;
	const cc = cosmiconfig('nodecg', {
		searchPlaces: isFile
			? [path.basename(cfgDirOrFile)]
			: ['nodecg.json', 'nodecg.yaml', 'nodecg.yml', 'nodecg.js', 'nodecg.config.js'],
		stopDir: cfgDir,
	});
	const result = cc.search(cfgDir);
	const userCfg = result?.config ?? {};

	if (userCfg?.bundles?.enabled && userCfg?.bundles?.disabled) {
		throw new Error('nodecg.json may only contain EITHER bundles.enabled OR bundles.disabled, not both.');
	} else if (!userCfg) {
		console.info('[nodecg] No config found, using defaults.');
	}

	const schema = getConfigSchema(userCfg);

	/**
	 * Generate the config in two passes, because Joi is kind of weird.
	 *
	 * We apply defaults, but we need to do that in a separate pass
	 * before we report validation errors.
	 */
	const { value: cfgWithDefaults } = schema.validate(userCfg, { abortEarly: false, allowUnknown: true });
	cfgWithDefaults.baseURL =
		cfgWithDefaults.baseURL ||
		`${cfgWithDefaults.host === '0.0.0.0' ? 'localhost' : String(cfgWithDefaults.host)}:${String(
			cfgWithDefaults.port,
		)}`;

	const validationResult = schema.validate(cfgWithDefaults, { noDefaults: true });
	if (validationResult.error) {
		if (!process.env.NODECG_TEST) {
			console.error('[nodecg] Config invalid:\n', validationResult.error.annotate());
		}

		throw new Error(validationResult.error.details[0]!.message);
	}

	const config: NodeCG.Config = validationResult.value;
	if (!config) {
		if (!process.env.NODECG_TEST) {
			console.error('[nodecg] config unexpectedly undefined. This is a bug with NodeCG, not your config.');
		}

		throw new Error('config undefined');
	}

	// Create the filtered config
	const filteredConfig: NodeCG.FilteredConfig = {
		host: config.host,
		port: config.port,
		baseURL: config.baseURL,
		logging: {
			console: {
				enabled: config.logging.console.enabled,
				level: config.logging.console.level,
				timestamps: config.logging.console.timestamps,
				replicants: config.logging.console.replicants,
			},
			file: {
				enabled: config.logging.file.enabled,
				level: config.logging.file.level,
				timestamps: config.logging.file.timestamps,
				replicants: config.logging.file.replicants,
			},
		},
		login: {
			enabled: config.login?.enabled,
		},
		sentry: {
			enabled: config.sentry?.enabled ?? false,
			dsn: config.sentry?.dsn ?? '',
		},
	};

	if (config.login.steam) {
		filteredConfig.login.steam = {
			enabled: config.login.steam.enabled,
		};
	}

	if (config.login.twitch) {
		filteredConfig.login.twitch = {
			enabled: config.login.twitch.enabled,
			clientID: config.login.twitch.clientID, // Validation wil have thrown if this is falsey.
			scope: config.login.twitch.scope,
		};
	}

	if (config.login.local) {
		filteredConfig.login.local = {
			enabled: config.login.local.enabled,
		};
	}

	if (config.login.discord) {
		filteredConfig.login.discord = {
			enabled: config.login.discord.enabled,
			clientID: config.login.discord.clientID, // Validation wil have thrown if this is falsey.
			scope: config.login.discord.scope,
		};
	}

	if (config.ssl) {
		filteredConfig.ssl = {
			enabled: config.ssl.enabled,
		};
	}

	return {
		config: clone(config),
		filteredConfig: clone(filteredConfig),
	};
}
