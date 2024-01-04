import { z } from 'zod';
import { argv } from 'yargs';
import { LogLevels } from './logger-interface';

const argvSchema = z.object({
	bundlesEnabled: z
		.string()
		.optional()
		.transform((val) => val?.split(',')),
	bundlesDisabled: z
		.string()
		.optional()
		.transform((val) => val?.split(',')),
	bundlesPaths: z
		.string()
		.optional()
		.transform((val) => val?.split(',')),
});

const parsedArgv = argvSchema.parse(argv);

export const nodecgConfigSchema = z
	.object({
		host: z.string().default('0.0.0.0').describe('The IP address or hostname that NodeCG should bind to.'),
		port: z.number().int().positive().default(9090).describe('The port that NodeCG should listen on.'),
		baseURL: z
			.string()
			.optional()
			.describe(
				"The URL of this instance. Used for things like cookies. Defaults to HOST:PORT. If you use a reverse proxy, you'll likely need to set this value.",
			),
		exitOnUncaught: z.boolean().default(true).describe('Whether or not to exit on uncaught exceptions.'),

		logging: z
			.object({
				console: z
					.object({
						enabled: z.boolean().default(true).describe('Whether to enable console logging.'),
						level: z.enum(LogLevels).default('info').describe('The log level to use.'),
						timestamps: z.boolean().default(true).describe('Whether to add timestamps to the console logging.'),
						replicants: z
							.boolean()
							.default(false)
							.describe('Whether to enable logging of the Replicants subsystem. Very spammy.'),
					})
					.default({ enabled: true }),
				file: z
					.object({
						enabled: z.boolean().default(false).describe('Whether to enable file logging.'),
						level: z.enum(LogLevels).default('info').describe('The log level to use.'),
						path: z.string().default('logs/nodecg.log').describe('The filepath to log to.'),
						timestamps: z.boolean().default(true).describe('Whether to add timestamps to the file logging.'),
						replicants: z
							.boolean()
							.default(false)
							.describe('Whether to enable logging of the Replicants subsystem. Very spammy.'),
					})
					.default({ enabled: false }),
			})
			.default({ console: {} }),

		bundles: z
			.object({
				enabled: z
					.array(z.string())
					.nullable()
					.default(parsedArgv.bundlesEnabled ?? null)
					.describe('A whitelist array of bundle names.'),
				disabled: z
					.array(z.string())
					.nullable()
					.default(parsedArgv.bundlesDisabled ?? null)
					.describe('A blacklist array of bundle names.'),
				paths: z
					.array(z.string())
					.default(parsedArgv.bundlesPaths ?? [])
					.describe('An array of additional paths where bundles are located.'),
			})
			.default({
				enabled: null,
				disabled: null,
				paths: [],
			}),

		login: z
			.object({
				enabled: z.boolean().default(false).describe('Whether to enable login security.'),
				sessionSecret: z.string().optional().describe('The secret used to salt sessions.'),
				forceHttpsReturn: z
					.boolean()
					.default(false)
					.describe(
						'Forces Steam & Twitch login return URLs to use HTTPS instead of HTTP. Useful in reverse proxy setups.',
					),

				steam: z
					.object({
						enabled: z.boolean().default(false).describe('Whether to enable Steam authentication.'),
						apiKey: z
							.string()
							.optional()
							.describe('A Steam API Key. Obtained from http://steamcommunity.com/dev/apikey'),
						allowedIds: z
							.array(z.string())
							.default([])
							.describe('Which 64 bit Steam IDs to allow. Can be obtained from https://steamid.io/'),
					})
					.optional()
					.refine((val) => (val?.enabled ? typeof val.apiKey === 'string' : true), {
						message: '"login.steam.apiKey" must be a string',
					}),

				twitch: z
					.object({
						enabled: z.boolean().default(false).describe('Whether to enable Twitch authentication.'),
						clientID: z
							.string()
							.optional()
							.describe('A Twitch application ClientID http://twitch.tv/kraken/oauth2/clients/new'),
						clientSecret: z
							.string()
							.optional()
							.describe('A Twitch application ClientSecret http://twitch.tv/kraken/oauth2/clients/new'),
						scope: z
							.string()
							.default('user_read')
							.describe('A space-separated string of Twitch application permissions.'),
						allowedUsernames: z.array(z.string()).default([]).describe('Which Twitch usernames to allow.'),
						allowedIds: z
							.array(z.string())
							.default([])
							.describe('Which Twitch IDs to allow. Can be obtained from https://twitchinsights.net/checkuser'),
					})
					.optional()
					.refine((val) => (val?.enabled ? typeof val.clientID === 'string' : true), {
						message: '"login.twitch.clientID" must be a string',
					})
					.refine((val) => (val?.enabled ? typeof val.clientSecret === 'string' : true), {
						message: '"login.twitch.clientID" must be a string',
					}),

				discord: z
					.object({
						enabled: z.boolean().default(false).describe('Whether to enable Discord authentication.'),
						clientID: z
							.string()
							.optional()
							.describe('A Discord application ClientID https://discord.com/developers/applications'),
						clientSecret: z
							.string()
							.optional()
							.describe('A Discord application ClientSecret https://discord.com/developers/applications'),
						scope: z
							.string()
							.default('identify')
							.describe(
								'A space-separated string of Discord application scopes. https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes',
							),
						allowedUserIDs: z.array(z.string()).default([]).describe('Which Discord user IDs to allow.'),
						allowedGuilds: z
							.array(
								z.object({
									guildID: z.string().describe('Users in this Discord Server are allowed to log in.'),
									allowedRoleIDs: z
										.array(z.string())
										.default([])
										.describe('Additionally require one of the roles on the server to log in.'),
									guildBotToken: z
										.string()
										.default('')
										.describe('Discord bot token, needed if allowedRoleIDs is used.'),
								}),
							)
							.default([]),
					})
					.optional()
					.refine((val) => (val?.enabled ? typeof val.clientID === 'string' : true), {
						message: '"login.discord.clientID" must be a string',
					})
					.refine((val) => (val?.enabled ? typeof val.clientSecret === 'string' : true), {
						message: '"login.discord.clientSecret" must be a string',
					}),

				local: z
					.object({
						enabled: z.boolean().default(false).describe('Enable Local authentication.'),
						allowedUsers: z
							.array(
								z.object({
									username: z.string(),
									password: z.string(),
								}),
							)
							.default([])
							.describe('Which users can log in.'),
					})
					.optional(),
			})
			.refine((val) => (val.enabled ? typeof val.sessionSecret === 'string' : true), {
				message: '"login.sessionSecret" must be a string',
			})
			.default({ enabled: false }),

		ssl: z
			.object({
				enabled: z.boolean().default(false).describe('Whether to enable SSL/HTTPS encryption.'),
				allowHTTP: z
					.boolean()
					.default(false)
					.describe('Whether to allow insecure HTTP connections while SSL is active.'),
				keyPath: z.string().optional().describe('The path to an SSL key file.'),
				certificatePath: z.string().optional().describe('The path to an SSL certificate file.'),
				passphrase: z.string().optional().describe('The passphrase for the provided key file.'),
			})
			.default({ enabled: false })
			.refine((val) => (val.enabled ? typeof val.keyPath === 'string' : true), {
				message: '"ssl.keyPath" must be a string',
			})
			.refine((val) => (val.enabled ? typeof val.certificatePath === 'string' : true), {
				message: '"ssl.certificatePath" must be a string',
			}),

		sentry: z
			.object({
				enabled: z.boolean().default(true).describe('Whether to enable Sentry error reporting.'),
				dsn: z.string().optional().describe("Your project's DSN, used to route alerts to the correct place."),
			})
			.default({ enabled: false })
			.refine((val) => (val.enabled ? typeof val.dsn === 'string' : true), {
				message: '"sentry.dsn" must be a string',
			}),
	})
	.transform((val) => {
		const host = val.host === '0.0.0.0' ? 'localhost' : val.host;
		return {
			...val,
			baseURL: val.baseURL ?? `${host}:${val.port}`,
		};
	});

export type NodeCGConfig = z.infer<typeof nodecgConfigSchema>;
