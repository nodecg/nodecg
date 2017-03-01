/* eslint-env node, browser */
/* global createjs */
'use strict';

const Replicant = require('./replicant');
const server = require('./server');
const filteredConfig = require('./config').filteredConfig;
const utils = require('./util');
const replicator = require('./replicator');
let io;

/**
 * Creates a new NodeCG API instance. It should never be necessary to use this constructor in a bundle,
 * as NodeCG automatically injects a pre-made API instance.
 * @constructor
 * @param {object} bundle - The bundle object to build an API instance from.
 */
function NodeCG(bundle, socket) {
	const self = this;

	// Make bundle name and config publicly accessible
	this.bundleName = bundle.name;

	/**
	 * An object containing the parsed content of `cfg/<bundle-name>.json`, the contents of which
	 * are read once when NodeCG starts up. Used to quickly access per-bundle configuration properties.
	 * @property {Object}
	 * @name NodeCG#bundleConfig
	 */
	this.bundleConfig = bundle.config;

	/**
	 * Provides access to NodeCG's logger, with the following methods. The logging level is set in `cfg/nodecg.json`,
	 * NodeCG's global config file.
	 * ```
	 * nodecg.log.trace('trace level logging');
	 * nodecg.log.debug('debug level logging');
	 * nodecg.log.info('info level logging');
	 * nodecg.log.warn('warn level logging');
	 * nodecg.log.error('error level logging');
	 * ```
	 * @function {Object}
	 * @name NodeCG#log
	 */
	this.log = require('./logger')(bundle.name);

	this._messageHandlers = [];

	if (process.browser) {
		// If title isn't set, set it to the bundle name
		document.addEventListener('DOMContentLoaded', () => {
			if (document.title === '') {
				document.title = self.bundleName;
			}
		}, false);

		// Make socket accessible to public methods
		this.socket = socket;
		this.socket.emit('joinRoom', bundle.name);

		if (bundle._hasSounds && window.createjs && createjs.Sound) {
			const soundCuesRep = new Replicant('soundCues', this.bundleName, {}, socket);
			const customCuesRep = new Replicant('customSoundCues', this.bundleName, {}, socket);
			this._soundFiles = new Replicant('assets:sounds', this.bundleName, {}, socket);
			this._bundleVolume = new Replicant(`volume:${this.bundleName}`, '_sounds', {}, socket);
			this._masterVolume = new Replicant(`volume:master`, '_sounds', {}, socket);

			this._soundCues = [];

			const loadedSums = new Set();
			createjs.Sound.on('fileload', e => {
				if (this.soundsReady || !e.data.sum) {
					return;
				}

				loadedSums.add(e.data.sum);
				const foundUnloaded = this._soundCues.some(cue => {
					if (cue.file) {
						return !loadedSums.has(cue.file.sum);
					}

					return false;
				});
				if (!foundUnloaded && !this.soundsReady) {
					this.soundsReady = true;
					window.dispatchEvent(new CustomEvent('ncgSoundsReady'));
				}
			});

			soundCuesRep.on('change', handleAnyCuesRepChange.bind(this));
			customCuesRep.on('change', handleAnyCuesRepChange.bind(this));

			/* eslint-disable no-inner-declarations */
			function handleAnyCuesRepChange() {
				_updateSoundCuesHas(this, soundCuesRep, customCuesRep);
				_updateInstanceVolumes(this);
				_registerSounds(this);
			}
			/* eslint-enable no-inner-declarations */

			this._soundFiles.on('change', () => _registerSounds(this));
			this._bundleVolume.on('change', () => _updateInstanceVolumes(this));
			this._masterVolume.on('change', () => _updateInstanceVolumes(this));
		}

		// Upon receiving a message, execute any handlers for it
		socket.on('message', data => {
			self.log.trace('Received message %s (sent to bundle %s) with data:',
				data.messageName, data.bundleName, data.content);

			self._messageHandlers.forEach(handler => {
				if (data.messageName === handler.messageName &&
					data.bundleName === handler.bundleName) {
					handler.func(data.content);
				}
			});
		});

		socket.on('error', err => {
			if (err.type === 'UnauthorizedError') {
				const url = [location.protocol, '//', location.host, location.pathname].join('');
				window.location.href = `/authError?code=${err.code}&message=${err.message}&viewUrl=${url}`;
			} else {
				self.log.error('Unhandled socket error:', err);
			}
		});
	} else {
		io = server.getIO();

		io.on('connection', socket => {
			socket.setMaxListeners(64); // Prevent console warnings when many extensions are installed
			socket.on('message', (data, cb) => {
				self.log.trace('[%s] Received message %s (sent to bundle %s) with data:',
					self.bundleName, data.messageName, data.bundleName, data.content);

				self._messageHandlers.forEach(handler => {
					if (data.messageName === handler.messageName &&
						data.bundleName === handler.bundleName) {
						handler.func(data.content, cb);
					}
				});
			});
		});
	}

	// Create read-only config property, which contains the current filtered NodeCG config
	Object.defineProperty(this, 'config', {
		value: filteredConfig,
		writable: false,
		enumerable: true
	});

	Object.freeze(this.config);
}

// ###NodeCG prototype

/**
 * Sends a message with optional data within the current bundle.
 * Messages can be sent from client to server, server to client, or client to client.
 *
 * Messages are namespaced by bundle. To send a message in another bundle's namespace,
 * use {@link NodeCG#sendMessageToBundle}.
 *
 * If a message is sent from a client (graphic or dashboard panel), to the server (an extension),
 * it may provide an optional callback called an `acknowledgement`.
 * Acknowledgements will not work for client-to-client nor server-to-client messages.
 * Only client-to-server messages support acknowledgements. This restriction is a limitation of
 * [Socket.IO](http://socket.io/docs/#sending-and-getting-data-%28acknowledgements%29).
 *
 * @param {string} messageName - The name of the message.
 * @param {mixed} [data] - The data to send.
 * @param {function} [cb] - _Browser only_ The callback to handle the server's
 * [acknowledgement](http://socket.io/docs/#sending-and-getting-data-%28acknowledgements%29) message, if any.
 *
 * @example <caption>Sending a normal message:</caption>
 * nodecg.sendMessage('printMessage', 'dope.');
 *
 * @example <caption>Sending a message and calling back with an acknowledgement:</caption>
 * // bundles/my-bundle/extension.js
 * module.exports = function(nodecg) {
 *     nodecg.listenFor('multiplyByTwo', function(value, callback) {
 *          callback(value * 2);
 *     });
 * }
 *
 * // bundles/my-bundle/graphics/script.js
 * nodecg.sendMessage('multiplyByTwo', 2, function(result) {
 *     console.log(result); // Will eventually print '4'
 * });
 */
NodeCG.prototype.sendMessage = function (messageName, data, cb) {
	if (typeof cb === 'undefined' && typeof data === 'function') {
		cb = data;
		data = null;
	}

	this.sendMessageToBundle(messageName, this.bundleName, data, cb);
};

NodeCG.sendMessageToBundle = function (messageName, bundleName, data, cb) {
	if (process.browser) {
		if (typeof cb === 'undefined' && typeof data === 'function') {
			cb = data;
			data = null;
		}

		window.socket.emit('message', {
			bundleName,
			messageName,
			content: data
		}, cb);
	} else {
		io.emit('message', {
			bundleName,
			messageName,
			content: data
		});
	}
};

/**
 * Sends a message to a specific bundle. Also available as a static method.
 * See {@link NodeCG#sendMessage} for usage details.
 * @param {string} messageName - The name of the message.
 * @param {string} bundleName - The name of the target bundle.
 * @param {mixed} [data] - The data to send.
 * @param {function} [cb] - _Browser only_ The callback to handle the server's
 * [acknowledgement](http://socket.io/docs/#sending-and-getting-data-%28acknowledgements%29) message, if any.
 */
/* eslint-disable no-unused-vars */
NodeCG.prototype.sendMessageToBundle = function (messageName, bundleName, data, cb) {
	this.log.trace('[%s] Sending message %s to bundle %s with data:',
		this.bundleName, messageName, bundleName, data);

	/* eslint-disable prefer-spread */
	NodeCG.sendMessageToBundle.apply(NodeCG, arguments);
	/* eslint-enable prefer-spread */
};
/* eslint-enable no-unused-vars */

/**
 * Listens for a message, and invokes the provided callback each time the message is received.
 * If any data was sent with the message, it will be passed to the callback.
 *
 * Messages are namespaced by bundle.
 * To listen to a message in another bundle's namespace, provide it as the second argument.
 *
 * @param {string} messageName - The name of the message.
 * @param {string} [bundleName=CURR_BNDL] - The bundle namespace to in which to listen for this message
 * @param {function} handler - The callback fired when this message is received.
 *
 * @example
 * nodecg.listenFor('printMessage', function (message) {
 *     console.log(message);
 * });
 *
 * @example <caption>Listening to a message in another bundle's namespace:</caption>
 * nodecg.listenFor('printMessage', 'another-bundle', function (message) {
 *     console.log(message);
 * });
 */
NodeCG.prototype.listenFor = function (messageName, bundleName, handler) {
	if (typeof handler === 'undefined') {
		handler = bundleName;
		bundleName = this.bundleName;
	}

	if (typeof handler !== 'function') {
		throw new Error(`argument "handler" must be a function, but you provided a(n) ${typeof handler}`);
	}

	this.log.trace('[%s] Listening for %s from bundle %s', this.bundleName, messageName, bundleName);

	// Check if a handler already exists for this message
	const len = this._messageHandlers.length;
	for (let i = 0; i < len; i++) {
		const existingHandler = this._messageHandlers[i];
		if (messageName === existingHandler.messageName && bundleName === existingHandler.bundleName) {
			throw new Error(`${this.bundleName} attempted to declare a duplicate "listenFor" handler: ${bundleName}:${messageName}`);
		}
	}

	this._messageHandlers.push({
		messageName,
		bundleName,
		func: handler
	});
};

/**
 * An object containing references to all Replicants that have been declared in this `window`, sorted by bundle.
 * E.g., `NodeCG.declaredReplicants.myBundle.myRep`
 */
NodeCG.declaredReplicants = Replicant.declaredReplicants;

NodeCG.Replicant = function (name, namespace, opts) {
	return new Replicant(name, namespace, opts, process.browser ? window.socket : null);
};

/**
 * Replicants are objcts which monitor changes to a variable's value.
 * The changes are replicated across all extensions, graphics, and dashboard panels.
 * When a Replicant changes in one of those places it is quickly updated in the rest,
 * and a `change` event is emitted allowing bundles to react to the changes in the data.
 *
 * If a Replicant with a given name in a given bundle namespace has already been declared,
 * the Replicant will automatically be assigned the existing value.
 *
 * Replicants must be declared in each context that wishes to use them. For instance,
 * declaring a replicant in an extension does not automatically make it available in a graphic.
 * The graphic must also declare it.
 *
 * By default Replicants will be saved to disk, meaning they will automatically be restored when NodeCG is restarted,
 * such as after an unexpected crash.
 * If you need to opt-out of this behaviour simply set `persistent: false` in the `opts` argument.
 *
 * As of NodeCG 0.8.4, Replicants can also be automatically validated against a JSON Schema that you provide.
 * See {@tutorial replicant-schemas} for more information.
 *
 * @param {string} name - The name of the replicant.
 * @param {string} [namespace] - The namespace to in which to look for this replicant. Defaults to the name of the current bundle.
 * @param {object} [opts] - The options for this replicant.
 * @param {*} [opts.defaultValue] - The default value to instantiate this Replicant with. The default value is only
 * applied if this Replicant has not previously been declared and if it has no persisted value.
 * @param {boolean} [opts.persistent=true] - Whether to persist the Replicant's value to disk on every change.
 * Persisted values are re-loaded on startup.
 * @param {string} [opts.schemaPath] - The filepath at which to look for a JSON Schema for this Replicant.
 * Defaults to `nodecg/bundles/${bundleName}/schemas/${replicantName}.json`. Please note that this default
 * path will be URIEncoded to ensure that it results in a valid filename.
 *
 * @example
 * const myRep = nodecg.Replicant('myRep', {defaultValue: 123});
 *
 * myRep.on('change', function(newValue, oldValue) {
 *     console.log('myRep changed from '+ oldValue +' to '+ newValue);
 * });
 *
 * myRep.value = 'Hello!';
 * myRep.value = {objects: 'work too!'};
 * myRep.value = {objects: {can: {be: 'nested!'}}};
 * myRep.value = ['Even', 'arrays', 'work!'];
 */
NodeCG.prototype.Replicant = function (name, namespace, opts) {
	if (!namespace || typeof namespace !== 'string') {
		opts = namespace;
		namespace = this.bundleName;
	}

	if (typeof opts !== 'object') {
		opts = {};
	}

	if (typeof opts.schemaPath === 'undefined') {
		opts.schemaPath = `bundles/${encodeURIComponent(namespace)}/schemas/${encodeURIComponent(name)}.json`;
	}

	return new NodeCG.Replicant(name, namespace, opts);
};

NodeCG.readReplicant = function (name, namespace, cb) {
	if (!name || typeof name !== 'string') {
		throw new Error('Must supply a name when reading a Replicant');
	}

	if (!namespace || typeof namespace !== 'string') {
		throw new Error('Must supply a namespace when reading a Replicant');
	}

	if (process.browser) {
		window.socket.emit('replicant:read', {name, namespace}, cb);
	} else {
		const replicant = replicator.find(name, namespace);
		if (replicant) {
			return replicant.value;
		}
	}
};

/**
 * Reads the value of a replicant once, and doesn't create a subscription to it. Also available as a static method.
 * @param {string} name - The name of the replicant.
 * @param {string} [bundle=CURR_BNDL] - The bundle namespace to in which to look for this replicant.
 * @param {function} cb - _Browser only_ The callback that handles the server's response which contains the value.
 * @example <caption>From an extension:</caption>
 * // Extensions have immediate access to the database of Replicants.
 * // For this reason, they can use readReplicant synchronously, without a callback.
 * module.exports = function(nodecg) {
 *     var myVal = nodecg.readReplicant('myVar', 'some-bundle');
 * }
 * @example <caption>From a graphic or dashboard panel:</caption>
 * // Graphics and dashboard panels must query the server to retrieve the value,
 * // and therefore must provide a callback.
 * nodecg.readReplicant('myRep', 'some-bundle', function(value) {
 *     // I can use 'value' now!
 *     console.log('myRep has the value '+ value +'!');
 * });
 */
NodeCG.prototype.readReplicant = function (name, bundle, cb) {
	if (!bundle || typeof bundle !== 'string') {
		cb = bundle;
		bundle = this.bundleName;
	}

	return NodeCG.readReplicant(name, bundle, cb);
};

if (process.browser) {
	window.NodeCG = NodeCG;

	/**
	 * _Browser only_<br/>
	 * Returns the specified dialog element.
	 * @param {string} name - The desired dialog's name.
	 * @param {string} [bundle=CURR_BNDL] - The bundle from which to select the dialog.
	 * @returns {object}
	 */
	NodeCG.prototype.getDialog = function (name, bundle) {
		bundle = bundle || this.bundleName;
		return window.top.document.getElementById(`${bundle}_${name}`);
	};

	/**
	 * _Browser only_<br/>
	 * Returns the specified dialog's iframe document.
	 * @param {string} name - The desired dialog's name.
	 * @param {string} [bundle=CURR_BNDL] - The bundle from which to select the dialog.
	 * @returns {object}
	 */
	NodeCG.prototype.getDialogDocument = function (name, bundle) {
		bundle = bundle || this.bundleName;
		return this.getDialog(name, bundle).querySelector('iframe').contentWindow.document;
	};

	/**
	 * Returns the sound cue of the provided `cueName` in the current bundle.
	 * Returns undefined if a cue by that name cannot be found in this bundle.
	 * @param cueName {String}
	 * @returns {Object|undefined} - A NodeCG cue object.
	 */
	NodeCG.prototype.findCue = function (cueName) {
		return this._soundCues.find(cue => cue.name === cueName);
	};

	/**
	 * Plays the sound cue of the provided `cueName` in the current bundle.
	 * Does nothing if the cue doesn't exist or if the cue has no assigned file to play.
	 * @param cueName {String}
	 * @param [opts] {Object}
	 * @param [opts.updateVolume=true] - Whether or not to let NodeCG automatically update this instance's volume
	 * when the user changes it on the dashboard.
	 * @returns {Object|undefined} - A SoundJS AbstractAudioInstance.
	 */
	NodeCG.prototype.playSound = function (cueName, opts) {
		if (!this._soundCues) {
			throw new Error(`Bundle "${this.bundleName}" has no soundCues`);
		}

		const cue = this.findCue(cueName);
		if (!cue) {
			throw new Error(`Cue "${cueName}" does not exist in bundle "${this.bundleName}"`);
		}

		if (!window.createjs || !window.createjs.Sound) {
			throw new Error('NodeCG Sound API methods are not available when SoundJS isn\'t present');
		}

		if (!cue.file) {
			return;
		}

		opts = opts || {};
		if (opts.updateVolume === undefined) {
			opts.updateVolume = true;
		}

		// Create an instance of the sound, which begins playing immediately.
		const instance = createjs.Sound.play(cueName);
		instance.cueName = cueName;

		// Set the volume.
		_setInstanceVolume(this, instance, cue);
		instance.updateVolume = opts.updateVolume;

		return instance;
	};

	/**
	 * Stops all currently playing instances of the provided `cueName`.
	 * @param cueName {String}
	 */
	NodeCG.prototype.stopSound = function (cueName) {
		if (!this._soundCues) {
			throw new Error(`Bundle "${this.bundleName}" has no soundCues`);
		}

		if (!this._soundCues.find(cue => cue.name === cueName)) {
			throw new Error(`Cue "${cueName}" does not exist in bundle "${this.bundleName}"`);
		}

		if (!window.createjs || !window.createjs.Sound) {
			throw new Error('NodeCG Sound API methods are not available when SoundJS isn\'t present');
		}

		for (let i = createjs.Sound._instances.length - 1; i >= 0; i--) {
			const instance = createjs.Sound._instances[i];
			if (instance.cueName === cueName) {
				instance.stop();
			}
		}
	};

	/**
	 * Stops all currently playing sounds on the page.
	 */
	NodeCG.prototype.stopAllSounds = function () {
		if (!window.createjs || !window.createjs.Sound) {
			throw new Error('NodeCG Sound API methods are not available when SoundJS isn\'t present');
		}

		createjs.Sound.stop();
	};
} else {
	/**
	 * _Extension only_<br/>
	 * Gets the server Socket.IO context.
	 * @function
	 */
	NodeCG.prototype.getSocketIOServer = server.getIO;

	/**
	 * _Extension only_<br/>
	 * Mounts express middleware to the main server express app.
	 * See the [express docs](http://expressjs.com/en/api.html#app.use) for usage.
	 * @function
	 */
	NodeCG.prototype.mount = server.mount;

	NodeCG.prototype.util = {};

	/**
	 * _Extension only_<br/>
	 * Checks if a session is authorized. Intended to be used in express routes.
	 * @param {object} req - A HTTP request.
	 * @param {object} res - A HTTP response.
	 * @param {function} next - The next middleware in the control flow.
	 */
	NodeCG.prototype.util.authCheck = utils.authCheck;

	/**
	 * _Extension only_<br/>
	 * Object containing references to all other loaded extensions. To access another bundle's extension,
	 * it _must_ be declared as a `bundleDependency` in your bundle's [`package.json`]{@tutorial manifest}.
	 * @property {Object}
	 * @name NodeCG#extensions
	 *
	 * @example
	 * // bundles/my-bundle/package.json
	 * {
     *     "name": "my-bundle"
     *     ...
     *     "bundleDependencies": {
     *         "other-bundle": "^1.0.0"
     *     }
     * }
	 *
	 * // bundles/my-bundle/extension.js
	 * module.exports = function(nodecg) {
     *     var otherBundle = nodecg.extensions['other-bundle'];
     *     // Now I can use `otherBundle`!
     * }
	 */
	Object.defineProperty(NodeCG.prototype, 'extensions', {
		get() {
			return server.getExtensions();
		},
		enumerable: true
	});
}

function _updateSoundCuesHas(ctx, soundCuesRep, customCuesRep) {
	if (soundCuesRep.value && !customCuesRep.value) {
		ctx._soundCues = soundCuesRep.value;
		return;
	}

	if (!soundCuesRep.value && customCuesRep.value) {
		ctx._soundCues = customCuesRep.value;
		return;
	}

	ctx._soundCues = soundCuesRep.value.concat(customCuesRep.value);
}

function _registerSounds(ctx) {
	ctx._soundCues.forEach(cue => {
		if (!cue.file) {
			return;
		}

		createjs.Sound.registerSound(`${cue.file.url}?sum=${cue.file.sum}`, cue.name, {
			channels: typeof cue.channels === 'undefined' ? 100 : cue.channels,
			sum: cue.file.sum
		});
	});
}

function _setInstanceVolume(ctx, instance, cue) {
	instance.volume = (ctx._masterVolume.value / 100) * (ctx._bundleVolume.value / 100) * (cue.volume / 100);
}

function _updateInstanceVolumes(ctx) {
	// Update the volume of any playing instances that haven't opted out of automatic volume updates.
	ctx._soundCues.forEach(cue => {
		createjs.Sound._instances.forEach(instance => {
			if (instance.cueName === cue.name && instance.updateVolume) {
				_setInstanceVolume(ctx, instance, cue);
			}
		});
	});
}

module.exports = NodeCG;
