'use strict';

// Native
const fs = require('fs');

// Packages
const clone = require('clone');
const convict = require('convict');

const CONVICT_LOG_LEVEL = {
	doc: 'The lowest level of output to log. "trace" is the most, "error" is the least.',
	format(val) {
		return ['trace', 'debug', 'info', 'warn', 'error'].includes(val);
	},
	default: 'info'
};

const VALIDATE_STRING_ARRAY = function (val) {
	return Array.isArray(val) && val.every(item => typeof item === 'string');
};

module.exports = function (userCfgPath) {
	const convictSchema = {
		host: {
			doc: 'The IP address or hostname that NodeCG should bind to.',
			format: String,
			default: '0.0.0.0'
		},
		port: {
			doc: 'The port that NodeCG should listen on.',
			format: 'port',
			default: 9090
		},
		baseURL: {
			doc: 'The URL of this instance. Used for things like cookies. Defaults to HOST:PORT. ' +
			'If you use a reverse proxy, you\'ll likely need to set this value.',
			format: String,
			default: ''
		},
		developer: {
			doc: 'Whether to enable features that speed up development. Not suitable for production.',
			format: Boolean,
			default: false
		},
		exitOnUncaught: {
			doc: 'Whether or not to exit on uncaught exceptions.',
			format: Boolean,
			default: true
		},
		logging: {
			replicants: {
				doc: 'Whether to enable logging of the Replicants subsystem. Very spammy.',
				format: Boolean,
				default: false
			},
			console: {
				enabled: {
					doc: 'Whether to enable console logging.',
					format: Boolean,
					default: true
				},
				level: CONVICT_LOG_LEVEL
			},
			file: {
				enabled: {
					doc: 'Whether to enable file logging.',
					format: Boolean,
					default: false
				},
				level: CONVICT_LOG_LEVEL,
				path: {
					doc: 'The filepath to log to.',
					type: String,
					default: 'logs/nodecg.log'
				}
			}
		},
		bundles: {
			enabled: {
				doc: 'A whitelist array of bundle names that will be the only ones loaded at startup.',
				format(val) {
					return VALIDATE_STRING_ARRAY(val) || val === null; // eslint-disable-line new-cap
				},
				default: null,
				arg: 'bundlesEnabled'
			},
			disabled: {
				doc: 'A blacklist array of bundle names that will be excluded from loading at startup.',
				format(val) {
					return VALIDATE_STRING_ARRAY(val) || val === null; // eslint-disable-line new-cap
				},
				default: null,
				arg: 'bundlesDisabled'
			}
		}
	};

	// Load user config if it exists, and merge it
	const userCfgExists = fs.existsSync(userCfgPath);
	if (userCfgExists) {
		const rawUserConfigFile = fs.readFileSync(userCfgPath, 'utf8');

		let userConfig;
		try {
			userConfig = JSON.parse(rawUserConfigFile);
		} catch (e) {
			throw new Error(`Failed to parse ${userCfgPath}. Please ensure that it contains only valid JSON.`);
		}

		if (userConfig.bundles) {
			if (userConfig.bundles.enabled && userConfig.bundles.disabled) {
				throw new Error('nodecg.json may only contain EITHER bundles.enabled OR bundles.disabled, not both.');
			}
		}

		convictSchema.login = {
			enabled: {
				doc: 'Whether to enable login security.',
				format: Boolean,
				default: false
			},
			sessionSecret: {
				doc: 'The secret used to salt sessions.',
				format: String,

				// This will throw if the user does not provide a value, but only if login security is enabled.
				default: userConfig.login && userConfig.login.enabled ? null : ''
			},
			forceHttpsReturn: {
				doc: 'Forces Steam & Twitch login return URLs to use HTTPS instead of HTTP. Useful in reverse proxy setups.',
				format: Boolean,
				default: false
			},
			steam: {
				enabled: {
					doc: 'Whether to enable Steam authentication.',
					format: Boolean,
					default: false
				},
				apiKey: {
					doc: 'A Steam API Key. Obtained from http://steamcommunity.com/dev/apikey',
					format: String,

					// This will throw if the user does not provide a value, but only if Steam auth is enabled.
					default: userConfig.login && userConfig.login.steam && userConfig.login.steam.enabled ? null : ''
				},
				allowedIds: {
					doc: 'Which 64 bit Steam IDs to allow. Can be obtained from https://steamid.io/',
					format: VALIDATE_STRING_ARRAY,

					// This will throw if the user does not provide a value, but only if Steam auth is enabled.
					default: userConfig.login && userConfig.login.steam && userConfig.login.steam.enabled ? null : []
				}
			},
			twitch: {
				enabled: {
					doc: 'Whether to enable Twitch authentication.',
					format: Boolean,
					default: false
				},
				clientID: {
					doc: 'A Twitch application ClientID http://twitch.tv/kraken/oauth2/clients/new',
					format: String,

					// This will throw if the user does not provide a value, but only if Twitch auth is enabled.
					default: userConfig.login && userConfig.login.twitch && userConfig.login.twitch.enabled ? null : ''
				},
				clientSecret: {
					doc: 'A Twitch application ClientSecret http://twitch.tv/kraken/oauth2/clients/new',
					format: String,

					// This will throw if the user does not provide a value, but only if Twitch auth is enabled.
					default: userConfig.login && userConfig.login.twitch && userConfig.login.twitch.enabled ? null : ''
				},
				scope: {
					doc: 'A space-separated string of Twitch application permissions.',
					format: String,
					default: 'user_read'
				},
				allowedUsernames: {
					doc: 'Which Twitch usernames to allow.',
					format: VALIDATE_STRING_ARRAY,

					// This will throw if the user does not provide a value, but only if Twitch auth is enabled.
					default: userConfig.login && userConfig.login.twitch && userConfig.login.twitch.enabled ? null : []
				}
			}
		};

		convictSchema.ssl = {
			enabled: {
				doc: 'Whether to enable SSL/HTTPS encryption.',
				format: Boolean,
				default: false
			},
			allowHTTP: {
				doc: 'Whether to allow insecure HTTP connections while SSL is active.',
				format: Boolean,
				default: false
			},
			keyPath: {
				doc: 'The path to an SSL key file.',
				format: String,

				// This will throw if the user does not provide a value, but only if SSL is enabled.
				default: userConfig.ssl && userConfig.ssl.enabled ? null : ''
			},
			certificatePath: {
				doc: 'The path to an SSL certificate file.',
				format: String,

				// This will throw if the user does not provide a value, but only if SSL is enabled.
				default: userConfig.ssl && userConfig.ssl.enabled ? null : ''
			}
		};

		convictSchema.sentry = {
			enabled: {
				doc: 'Whether to enable Sentry error reporting.',
				format: Boolean,
				default: false
			},
			dsn: {
				doc: 'Your private DSN, for server-side error reporting.',
				format: String,

				// This will throw if the user does not provide a value, but only if Sentry is enabled.
				default: userConfig.sentry && userConfig.sentry.enabled ? null : ''
			},
			publicDsn: {
				doc: 'Your public sentry DSN, for browser error reporting.',
				format: String,

				// This will throw if the user does not provide a value, but only if Sentry is enabled.
				default: userConfig.sentry && userConfig.sentry.enabled ? null : ''
			}
		};
	}

	const convictConfig = convict(convictSchema);
	if (userCfgExists) {
		convictConfig.loadFile(userCfgPath);
	} else {
		console.info('[nodecg] No config found, using defaults.');
	}

	convictConfig.validate({allowed: 'strict'});
	const config = convictConfig.getProperties();

	config.baseURL = config.baseURL || `${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`;

	if (!config.login) {
		config.login = {};
	}

	if (!config.sentry) {
		config.sentry = {};
	}

	if (config.developer) {
		console.warn('[nodecg] Developer mode is active! Be sure to disable this in production.');
	}

	// Create the filtered config
	const filteredConfig = {
		host: config.host,
		port: config.port,
		developer: config.developer,
		baseURL: config.baseURL,
		logging: {
			replicants: config.logging.replicants,
			console: config.logging.console,
			file: {
				enabled: config.logging.file.enabled,
				level: config.logging.file.level
			}
		},
		sentry: {
			enabled: config.sentry.enabled,
			publicDsn: config.sentry.publicDsn
		}
	};

	if (config.login) {
		filteredConfig.login = {
			enabled: config.login.enabled
		};

		if (config.login.steam) {
			filteredConfig.login.steam = {
				enabled: config.login.steam.enabled
			};
		}

		if (config.login.twitch) {
			filteredConfig.login.twitch = {
				enabled: config.login.twitch.enabled,
				clientID: config.login.twitch.clientID,
				scope: config.login.twitch.scope
			};
		}
	}

	if (config.ssl) {
		filteredConfig.ssl = {
			enabled: config.ssl.enabled
		};
	}

	return {
		config: clone(config),
		filteredConfig: clone(filteredConfig)
	};
};
