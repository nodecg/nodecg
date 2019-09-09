/* eslint-env node, browser */
/* global createjs */
'use strict';

const express = require('express');
const Replicant = require('./replicant');
const server = require('./server');
const {filteredConfig} = require('./config');
const utils = require('./util');
const replicator = require('./replicator');
const isError = require('is-error');
const serializeError = require('serialize-error');
const {version} = require('../package.json');

let io;

const apiContexts = new Set();

/**
 * Creates a new NodeCG API instance. It should never be necessary to use this constructor in a bundle,
 * as NodeCG automatically injects a pre-made API instance.
 * @constructor
 * @param {object} bundle - The bundle object to build an API instance from.
 * @param {object} socket - The Socket.IO socket instance to communicate with.
 */
function NodeCG(bundle, socket) {
	const self = this;

	/**
	 * The name of the bundle which this NodeCG API instance is for.
	 * @name NodeCG#bundleName
	 */
	this.bundleName = bundle.name;

	/**
	 * An object containing the parsed content of `cfg/<bundle-name>.json`, the contents of which
	 * are read once when NodeCG starts up. Used to quickly access per-bundle configuration properties.
	 * @name NodeCG#bundleConfig
	 */
	this.bundleConfig = bundle.config;

	/**
	 * The version (from package.json) of the bundle which this NodeCG API instance is for.
	 * @name NodeCG#bundleVersion
	 */
	this.bundleVersion = bundle.version;

	/**
	 * Provides information about the current git status of this bundle, if found.
	 * @name NodeCG#bundleGit
	 * @readonly
	 * @property {String} branch - What branch this bundle is on.
	 * @property {String} hash - The full hash of the commit this bundle is on.
	 * @property {String} shortHash - The short hash of the commit this bundle is on.
	 * @property {Date} [date] - The date of the commit this bundle is on.
	 * @property {String} [message] - The message of the commit this bundle is on.
	 */
	Object.defineProperty(this, 'bundleGit', {
		value: bundle.git,
		writable: false
	});
	Object.freeze(this.bundleGit);

	/**
	 * Provides easy access to the Logger class.
	 * Useful in cases where you want to create your own custom logger.
	 * @type {Object}
	 * @name NodeCG#Logger
	 */
	this.Logger = require('./logger');

	/**
	 * An instance of NodeCG's Logger, with the following methods. The logging level is set in `cfg/nodecg.json`,
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
	this.log = new this.Logger(bundle.name);

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
			this._masterVolume = new Replicant('volume:master', '_sounds', {}, socket);

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
			self.log.trace(
				'Received message %s (sent to bundle %s) with data:',
				data.messageName, data.bundleName, data.content
			);

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
			socket.on('message', (data, ack) => {
				self.log.trace(
					'Received message %s (sent to bundle %s) with data:',
					data.messageName, data.bundleName, data.content
				);

				const wrappedAck = _wrapAcknowledgement(ack);
				self._messageHandlers.forEach(handler => {
					if (data.messageName === handler.messageName &&
						data.bundleName === handler.bundleName) {
						handler.func(data.content, wrappedAck);
					}
				});
			});
		});
	}

	// Create read-only config property, which contains the current filtered NodeCG config
	Object.defineProperty(this, 'config', {
		value: JSON.parse(JSON.stringify(filteredConfig)),
		writable: false,
		enumerable: true
	});

	Object.freeze(this.config);
	apiContexts.add(this);
}

// ###NodeCG prototype

NodeCG.version = version;

/**
 * Sends a message with optional data within the current bundle.
 * Messages can be sent from client to server, server to client, or client to client.
 *
 * Messages are namespaced by bundle. To send a message in another bundle's namespace,
 * use {@link NodeCG#sendMessageToBundle}.
 *
 * When a `sendMessage` is used from a client context (i.e., graphic or dashboard panel),
 * it returns a `Promise` called an "acknowledgement". Your server-side code (i.e., extension)
 * can invoke this acknowledgement with whatever data (or error) it wants. Errors sent to acknowledgements
 * from the server will be properly serialized and intact when received on the client.
 *
 * Alternatively, if you do not wish to use a `Promise`, you can provide a standard error-first
 * callback as the last argument to `sendMessage`.
 *
 * If your server-side code has multiple listenFor handlers for your message,
 * you must first check if the acknowledgement has already been handled before
 * attempting to call it. You may so do by checking the `.handled` boolean
 * property of the `ack` function passed to your listenFor handler.
 *
 * See [Socket.IO's docs](http://socket.io/docs/#sending-and-getting-data-%28acknowledgements%29)
 * for more information on how acknowledgements work under the hood.
 *
 * @param {string} messageName - The name of the message.
 * @param {mixed} [data] - The data to send.
 * @param {function} [cb] - _Browser only_ The error-first callback to handle the server's
 * [acknowledgement](http://socket.io/docs/#sending-and-getting-data-%28acknowledgements%29) message, if any.
 * @return {Promise} - _Browser only_ A Promise that is rejected if the first argument provided to the
 * acknowledgement is an `Error`, otherwise it is resolved with the remaining arguments provided to the acknowledgement.
 *
 * @example <caption>Sending a normal message:</caption>
 * nodecg.sendMessage('printMessage', 'dope.');
 *
 * @example <caption>Sending a message and replying with an acknowledgement:</caption>
 * // bundles/my-bundle/extension.js
 * module.exports = function (nodecg) {
 *     nodecg.listenFor('multiplyByTwo', (value, ack) => {
 *         if (value === 4) {
 *             ack(new Error('I don\'t like multiplying the number 4!');
 *             return;
 *         }
 *
 *         // acknowledgements should always be error-first callbacks.
 *         // If you do not wish to send an error, use a falsey value
 *         // like "null" instead.
 *         if (ack && !ack.handled) {
 *             ack(null, value * 2);
 *         }
 *     });
 * }
 *
 * // bundles/my-bundle/graphics/script.js
 * // Both of these examples are functionally identical.
 *
 * // Promise acknowledgement
 * nodecg.sendMessage('multiplyByTwo', 2)
 *     .then(result => {
 *         console.log(result); // Will eventually print '4'
 *     .catch(error => {
 *         console.error(error);
 *     });
 *
 * // Error-first callback acknowledgement
 * nodecg.sendMessage('multiplyByTwo', 2, (error, result) => {
 *     if (error) {
 *         console.error(error);
 *         return;
 *     }
 *
 *     console.log(result); // Will eventually print '4'
 * });
 */
NodeCG.prototype.sendMessage = function (messageName, data, cb) {
	if (typeof cb === 'undefined' && typeof data === 'function') {
		cb = data;
		data = null;
	}

	return this.sendMessageToBundle(messageName, this.bundleName, data, cb);
};

NodeCG.sendMessageToBundle = function (messageName, bundleName, data, cb) {
	// This is what enables intra-context messaging.
	// I.e., passing messages from one extension to another in the same Node.js context.
	process.nextTick(() => {
		apiContexts.forEach(ctx => {
			ctx._messageHandlers.forEach(handler => {
				if (messageName === handler.messageName &&
					bundleName === handler.bundleName) {
					handler.func(data);
				}
			});
		});
	});

	if (process.browser) {
		if (typeof cb === 'undefined' && typeof data === 'function') {
			cb = data;
			data = null;
		}

		if (typeof cb === 'function') {
			window.socket.emit('message', {
				bundleName,
				messageName,
				content: data
			}, (err, ...args) => {
				cb(err, ...args);
			});
		} else {
			return new Promise((resolve, reject) => {
				window.socket.emit('message', {
					bundleName,
					messageName,
					content: data
				}, (err, ...args) => {
					if (err) {
						reject(err);
					} else {
						resolve(...args);
					}
				});
			});
		}
	} else {
		io.emit('message', {
			bundleName,
			messageName,
			content: data
		});
	}
};

/* eslint-disable no-unused-vars */
/**
 * Sends a message to a specific bundle. Also available as a static method.
 * See {@link NodeCG#sendMessage} for usage details.
 * @param {string} messageName - The name of the message.
 * @param {string} bundleName - The name of the target bundle.
 * @param {mixed} [data] - The data to send.
 * @param {function} [cb] - _Browser only_ The error-first callback to handle the server's
 * [acknowledgement](http://socket.io/docs/#sending-and-getting-data-%28acknowledgements%29) message, if any.
 * @return {Promise|undefined} - _Browser only_ A Promise that is rejected if the first argument provided to the
 * acknowledgement is an `Error`, otherwise it is resolved with the remaining arguments provided to the acknowledgement.
 * But, if a callback was provided, this return value will be `undefined`, and there will be no Promise.
 */
NodeCG.prototype.sendMessageToBundle = function (messageName, bundleName, data, cb) {
	this.log.trace('Sending message %s to bundle %s with data:', messageName, bundleName, data);

	// eslint-disable-next-line prefer-spread, prefer-rest-params
	return NodeCG.sendMessageToBundle.apply(NodeCG, arguments);
};
/* eslint-enable no-unused-vars */

/**
 * Listens for a message, and invokes the provided callback each time the message is received.
 * If any data was sent with the message, it will be passed to the callback.
 *
 * Messages are namespaced by bundle.
 * To listen to a message in another bundle's namespace, provide it as the second argument.
 *
 * You may define multiple listenFor handlers for a given message.
 * They will be called in the order they were registered.
 *
 * @param {string} messageName - The name of the message.
 * @param {string} [bundleName=CURR_BNDL] - The bundle namespace to in which to listen for this message
 * @param {function} handlerFunc - The callback fired when this message is received.
 *
 * @example
 * nodecg.listenFor('printMessage', message => {
 *     console.log(message);
 * });
 *
 * @example <caption>Listening to a message in another bundle's namespace:</caption>
 * nodecg.listenFor('printMessage', 'another-bundle', message => {
 *     console.log(message);
 * });
 */
NodeCG.prototype.listenFor = function (messageName, bundleName, handlerFunc) {
	if (typeof handlerFunc === 'undefined') {
		handlerFunc = bundleName;
		bundleName = this.bundleName;
	}

	if (typeof handlerFunc !== 'function') {
		throw new Error(`argument "handler" must be a function, but you provided a(n) ${typeof handlerFunc}`);
	}

	this.log.trace('Listening for %s from bundle %s', messageName, bundleName);
	this._messageHandlers.push({
		messageName,
		bundleName,
		func: handlerFunc
	});
};

/**
 * Removes a listener for a message.
 *
 * Messages are namespaced by bundle.
 * To remove a listener to a message in another bundle's namespace, provide it as the second argument.
 *
 * @param {string} messageName - The name of the message.
 * @param {string} [bundleName=CURR_BNDL] - The bundle namespace to in which to listen for this message
 * @param {function} handlerFunc - A reference to a handler function added as a listener to this message via {@link NodeCG#listenFor}.
 * @returns {boolean}
 *
 * @example
 * nodecg.unlisten('printMessage', someFunctionName);
 *
 * @example <caption>Removing a listener from a message in another bundle's namespace:</caption>
 * nodecg.unlisten('printMessage', 'another-bundle', someFunctionName);
 */
NodeCG.prototype.unlisten = function (messageName, bundleName, handlerFunc) {
	if (typeof handlerFunc === 'undefined') {
		handlerFunc = bundleName;
		bundleName = this.bundleName;
	}

	if (typeof handlerFunc !== 'function') {
		throw new Error(`argument "handler" must be a function, but you provided a(n) ${typeof handlerFunc}`);
	}

	this.log.trace('[%s] Removing listener for %s from bundle %s', this.bundleName, messageName, bundleName);

	// Find the index of this handler in the array.
	const index = this._messageHandlers.findIndex(handler => {
		return handler.messageName === messageName &&
			handler.bundleName === bundleName &&
			handler.func === handlerFunc;
	});

	// If the handler exists, remove it and return true.
	if (index >= 0) {
		this._messageHandlers.splice(index, 1);
		return true;
	}

	// Else, return false.
	return false;
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
 * Replicants are objects which monitor changes to a variable's value.
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
 * @param {number} [opts.persistenceInterval=DEFAULT_PERSISTENCE_INTERVAL] - Interval between each persistence, in milliseconds.
 * @param {string} [opts.schemaPath] - The filepath at which to look for a JSON Schema for this Replicant.
 * Defaults to `nodecg/bundles/${bundleName}/schemas/${replicantName}.json`. Please note that this default
 * path will be URIEncoded to ensure that it results in a valid filename.
 *
 * @example
 * const myRep = nodecg.Replicant('myRep', {defaultValue: 123});
 *
 * myRep.on('change', (newValue, oldValue) => {
 *     console.log(`myRep changed from ${oldValue} to ${newValue}`);
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
 * Lets you easily wait for a group of Replicants to finish declaring.
 *
 * Returns a promise which is resolved once all provided Replicants
 * have emitted a `change` event, which is indicates that they must
 * have finished declaring.
 *
 * This method is only useful in client-side code.
 * Server-side code never has to wait for Replicants.
 *
 * @param replicants {Replicant}
 * @returns {Promise<any>}
 *
 * @example <caption>From a graphic or dashboard panel:</caption>
 * const rep1 = nodecg.Replicant('rep1');
 * const rep2 = nodecg.Replicant('rep2');
 *
 * // You can provide as many Replicant arguments as you want,
 * // this example just uses two Replicants.
 * NodeCG.waitForReplicants(rep1, rep2).then(() => {
 *     console.log('rep1 and rep2 are fully declared and ready to use!');
 * });
 */
NodeCG.waitForReplicants = function (...replicants) {
	return new Promise(resolve => {
		const numReplicants = replicants.length;
		let declaredReplicants = 0;
		replicants.forEach(replicant => {
			replicant.once('change', () => {
				declaredReplicants++;
				if (declaredReplicants >= numReplicants) {
					resolve();
				}
			});
		});
	});
};

/**
 * Reads the value of a replicant once, and doesn't create a subscription to it. Also available as a static method.
 * @param {string} name - The name of the replicant.
 * @param {string} [bundle=CURR_BNDL] - The bundle namespace to in which to look for this replicant.
 * @param {function} cb - _Browser only_ The callback that handles the server's response which contains the value.
 * @example <caption>From an extension:</caption>
 * // Extensions have immediate access to the database of Replicants.
 * // For this reason, they can use readReplicant synchronously, without a callback.
 * module.exports = function (nodecg) {
 *     var myVal = nodecg.readReplicant('myVar', 'some-bundle');
 * }
 * @example <caption>From a graphic or dashboard panel:</caption>
 * // Graphics and dashboard panels must query the server to retrieve the value,
 * // and therefore must provide a callback.
 * nodecg.readReplicant('myRep', 'some-bundle', value => {
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
		return window.top.document
			.querySelector('ncg-dashboard').shadowRoot
			.querySelector(`#dialogs #${bundle}_${name}`);
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

	/**
	 * _Extension only_<br/>
	 * Creates a new express router.
	 * See the [express docs](http://expressjs.com/en/api.html#express.router) for usage.
	 * @function
	 */
	NodeCG.prototype.Router = express.Router;

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
	 * module.exports = function (nodecg) {
     *     const otherBundle = nodecg.extensions['other-bundle'];
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
	if (soundCuesRep.status !== 'declared' || customCuesRep.status !== 'declared') {
		return;
	}

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
	const volume = (ctx._masterVolume.value / 100) * (ctx._bundleVolume.value / 100) * (cue.volume / 100);
	// Volue value must be finite or SoundJS throws error
	instance.volume = isFinite(volume) ? volume : 0;
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

/**
 * By default, Errors get serialized to empty objects when run through JSON.stringify.
 * This function wraps an "acknowledgement" callback and checks if the first argument
 * is an Error. If it is, that Error is serialized _before_ being sent off to Socket.IO
 * for serialization to be sent across the wire.
 * @param ack {Function}
 * @private
 * @ignore
 * @returns {Function}
 */
function _wrapAcknowledgement(ack) {
	let handled = false;
	const wrappedAck = function (firstArg, ...restArgs) {
		if (handled) {
			throw new Error('Acknowledgement already handled');
		}

		handled = true;

		if (isError(firstArg)) {
			firstArg = serializeError(firstArg);
		}

		ack(firstArg, ...restArgs);
	};

	Object.defineProperty(wrappedAck, 'handled', {
		get() {
			return handled;
		}
	});

	return wrappedAck;
}

module.exports = NodeCG;
