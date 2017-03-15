'use strict';

const fs = require('fs');
const extend = require('extend');
const defaults = require('json-schema-defaults');
const validator = require('is-my-json-valid');
const clone = require('clone');

module.exports = function (userCfgPath) {
	let config;
	const schema = {
		$schema: 'http://json-schema.org/draft-04/schema#',
		type: 'object',

		definitions: {
			level: {
				description: 'The lowest level of output to log. "trace" is the most, "error" is the least.',
				enum: ['trace', 'debug', 'info', 'warn', 'error'],
				default: 'info'
			}
		},

		properties: {
			host: {
				description: 'The IP address or hostname that NodeCG should bind to.',
				type: 'string',
				default: '0.0.0.0'
			},
			port: {
				description: 'The port that NodeCG should listen on.',
				type: 'integer',
				default: 9090
			},
			developer: {
				description: 'Whether to enable features that speed up development. Not suitable for production.',
				type: 'boolean',
				default: false
			},
			exitOnUncaught: {
				description: 'Whether or not to exit on uncaught exceptions.',
				type: 'boolean',
				defalt: true
			},
			logging: {
				type: 'object',
				properties: {
					replicants: {
						description: 'Whether to enable logging of the Replicants subsystem. Very spammy.',
						type: 'boolean',
						default: false
					},
					console: {
						type: 'object',
						properties: {
							enabled: {
								description: 'Whether to enable console logging.',
								type: 'boolean',
								default: true
							},
							level: {$ref: '#/definitions/level'}
						}
					},
					file: {
						type: 'object',
						properties: {
							enabled: {
								description: 'Whether to enable file logging.',
								type: 'boolean',
								default: false
							},
							path: {
								description: 'The filepath to log to.',
								type: 'string',
								default: 'logs/nodecg.log'
							},
							level: {$ref: '#/definitions/level'}
						}
					}
				}
			},
			autodeps: {
				type: 'object',
				properties: {
					npm: {
						description: 'Whether to enable autoinstalling NPM dependancies in bundles.',
						type: 'boolean',
						default: true
					},
					bower: {
						description: 'Whether to enable autoinstalling Bower dependancies in bundles.',
						type: 'boolean',
						default: true
					}
				}
			},
			bundles: {
				type: 'object',
				properties: {
					enabled: {
						description: 'A whitelist array of bundle names that will be the only ones loaded at startup.',
						type: 'array',
						items: {
							type: 'string'
						}
					},
					disabled: {
						description: 'A blacklist array of bundle names that will not be loaded at startup.',
						type: 'array',
						items: {
							type: 'string'
						}
					}
				}
			}
		}
	};

	// Load user config if it exists, and merge it
	if (fs.existsSync(userCfgPath)) {
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

		if (userConfig.login && userConfig.login.enabled) {
			schema.properties.login = {
				type: 'object',
				properties: {
					enabled: {
						description: 'Whether to enable login security.',
						type: 'boolean',
						default: false
					},
					sessionSecret: {
						description: 'The secret used to salt sessions.',
						type: 'string'
					},
					forceHttpsReturn: {
						description: 'Forces Steam & Twitch login return URLs to use HTTPS instead of HTTP',
						type: 'boolean',
						default: false
					}
				},
				required: ['sessionSecret']
			};

			if (userConfig.login.steam && userConfig.login.steam.enabled) {
				schema.properties.login.properties.steam = {
					type: 'object',
					properties: {
						enabled: {
							description: 'Whether to enable Steam authentication.',
							type: 'boolean',
							default: false
						},
						apiKey: {
							description: 'A Steam API Key. Obtained from http://steamcommunity.com/dev/apikey',
							type: 'string'
						},
						allowedIds: {
							description: 'Which 64 bit Steam IDs to allow. Can be obtained from https://steamid.io/',
							type: 'array',
							items: {
								type: 'string'
							}
						}
					},
					required: ['apiKey', 'allowedIds']
				};
			}

			if (userConfig.login.twitch && userConfig.login.twitch.enabled) {
				schema.properties.login.properties.twitch = {
					type: 'object',
					properties: {
						enabled: {
							description: 'Whether to enable Twitch authentication.',
							type: 'boolean',
							default: false
						},
						clientID: {
							description: 'A Twitch application ClientID http://twitch.tv/kraken/oauth2/clients/new',
							type: 'string'
						},
						clientSecret: {
							description: 'A Twitch application ClientSecret http://twitch.tv/kraken/oauth2/clients/new',
							type: 'string'
						},
						scope: {
							description: 'A space-separated string of Twitch application permissions.',
							type: 'string',
							default: 'user_read'
						},
						allowedUsernames: {
							description: 'Which Twitch usernames to allow.',
							type: 'array',
							items: {
								type: 'string'
							}
						}
					},
					required: ['clientID', 'clientSecret', 'allowedUsernames']
				};
			}
		}

		if (userConfig.ssl && userConfig.ssl.enabled) {
			schema.properties.ssl = {
				type: 'object',
				properties: {
					enabled: {
						description: 'Whether to enable SSL/HTTPS encryption.',
						type: 'boolean',
						default: false
					},
					allowHTTP: {
						description: 'Whether to allow insecure HTTP connections while SSL is active.',
						type: 'boolean',
						default: false
					},
					keyPath: {
						description: 'The path to an SSL key file.',
						type: 'string'
					},
					certificatePath: {
						description: 'The path to an SSL certificate file.',
						type: 'string'
					}
				},
				required: ['keyPath', 'certificatePath']
			};
		}

		if (userConfig.rollbar && userConfig.rollbar.enabled) {
			schema.properties.rollbar = {
				type: 'object',
				properties: {
					enabled: {
						description: 'Whether to enable Rollbar error reporting.',
						type: 'boolean',
						default: false
					},
					postServerItem: {
						description: 'Your Rollbar POST_SERVER_ITEM_ACCESS_TOKEN.',
						type: 'string'
					},
					postClientItem: {
						description: 'Your Rollbar POST_CLIENT_ITEM_ACCESS_TOKEN.',
						type: 'string'
					},
					environment: {
						description: 'The current environment (development, production, staging, etc.)',
						type: 'string',
						default: 'production'
					}
				},
				required: ['postServerItem', 'postClientItem']
			};
		}

		const defaultConfig = defaults(schema);
		config = extend(true, defaultConfig, userConfig);
	} else {
		console.info('[nodecg] No config found, using defaults.');
		config = defaults(schema);
	}

	config.baseURL = config.baseURL || `${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`;

	const validate = validator(schema, {greedy: true});
	const result = validate(config);
	if (!result) {
		let errorMessage = `${userCfgPath} is invalid:\n`;
		const errors = validate.errors;
		errors.forEach(error => {
			const field = error.field.replace('data.', '');
			errorMessage += `\t${field} ${error.message}\n`;
		});
		throw new Error(errorMessage);
	}

	if (!config.login) {
		config.login = {};
	}

	if (!config.rollbar) {
		config.rollbar = {};
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
		rollbar: {
			enabled: config.rollbar.enabled,
			environment: config.rollbar.environment
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
