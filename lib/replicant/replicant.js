'use strict';

// Native
const EventEmitter = require('events');
const fs = require('fs');
const throttle = require('lodash.throttle');
const path = require('path');

// Packages
const $RefParser = require('json-schema-lib');
const clone = require('clone');
const {LocalStorage} = require('node-localstorage');
const schemaDefaults = require('json-schema-defaults');
const sha1 = require('sha1');

// Ours
const replicator = require('../replicator');
const shared = require('./shared');
const replaceRefs = require('./schema-hacks');

const REPLICANTS_ROOT = path.join(process.env.NODECG_ROOT, 'db/replicants');

class Replicant extends EventEmitter {
	get value() {
		return this.__value;
	}

	set value(newValue) {
		if (newValue === this.__value) {
			this.log.replicants('value unchanged, no action will be taken');
			return true;
		}

		this.validate(newValue);
		this.log.replicants('running setter with', newValue);
		replicator.assign(this, newValue);
		return true;
	}

	/* eslint-disable constructor-super */
	constructor(name, namespace, opts = {}) {
		if (!name || typeof name !== 'string') {
			throw new Error('Must supply a name when instantiating a Replicant');
		}

		if (!namespace || typeof namespace !== 'string') {
			throw new Error('Must supply a namespace when instantiating a Replicant');
		}

		// If replicant already exists, return that.
		if ({}.hasOwnProperty.call(replicator.declaredReplicants, namespace)) {
			if ({}.hasOwnProperty.call(replicator.declaredReplicants[namespace], name)) {
				const existing = replicator.declaredReplicants[namespace][name];
				existing.log.replicants('Existing replicant found, returning that instead of creating a new one.');
				return existing;
			}
		} else {
			replicator.declaredReplicants[namespace] = {};
		}

		super();

		// Load logger
		this.log = require('../logger')(`Replicant/${namespace}.${name}`);

		if (typeof opts.persistent === 'undefined') {
			opts.persistent = true;
		}

		if (typeof opts.persistenceInterval === 'undefined') {
			opts.persistenceInterval = shared.DEFAULT_PERSISTENCE_INTERVAL;
		}

		this.name = name;
		this.namespace = namespace;
		this.opts = opts;
		this.revision = 0;

		replicator.declaredReplicants[namespace][name] = this;

		this._operationQueue = [];

		// Assign a stub so that `validate` can still be freely called even if there's no schema. Less checking to do.
		this.validate = function () {
			return true;
		};

		// If present, parse the schema and generate the validator function.
		if (opts.schemaPath) {
			const absoluteSchemaPath = path.isAbsolute(opts.schemaPath) ?
				opts.schemaPath :
				global.isZeitPkg ?
					path.resolve(__dirname, '../..', opts.schemaPath) :
					path.join(process.env.NODECG_ROOT, opts.schemaPath);
			if (fs.existsSync(absoluteSchemaPath)) {
				try {
					const schema = $RefParser.readSync(absoluteSchemaPath);
					this.schema = replaceRefs(schema.root, schema.rootFile, schema.files);
					this.schemaSum = sha1(this.schema);
					this.validate = shared.generateValidator(this);
				} catch (e) {
					/* istanbul ignore next */
					if (!process.env.NODECG_TEST) {
						this.log.error('Schema could not be loaded, are you sure that it is valid JSON?\n', e.stack);
					}
				}
			}
		}

		// Initialize the storage object if not present
		if (!{}.hasOwnProperty.call(replicator.stores, namespace)) {
			replicator.stores[namespace] = new LocalStorage(path.join(REPLICANTS_ROOT, namespace));
		}

		// Get the existing value, if any, and JSON parse if its an object
		let existingValue = replicator.stores[namespace].getItem(`${name}.rep`);
		try {
			existingValue = JSON.parse(existingValue);
		} catch (e) {}

		// Set the default value, if a schema is present and no default value was provided.
		if (this.schema && typeof opts.defaultValue === 'undefined') {
			opts.defaultValue = schemaDefaults(this.schema);
		}

		// If `opts.persistent` is true and this replicant has a persisted value, try to load that persisted value.
		// Else, apply `opts.defaultValue`.
		if (opts.persistent && typeof existingValue !== 'undefined' && existingValue !== null) {
			if (this.validate(existingValue, {throwOnInvalid: false})) {
				this.value = shared._proxyRecursive(this, existingValue, '/');
				this.log.replicants('Loaded a persisted value from localStorage:', existingValue);
			} else {
				this.value = shared._proxyRecursive(this, schemaDefaults(this.schema), '/');
				this.log.replicants('Discarded persisted value, as it failed schema validation. Replaced with defaults from schema.');
			}
		} else {
			if (this.schema) {
				if (typeof opts.defaultValue !== 'undefined') {
					this.validate(opts.defaultValue);
				}
			}

			this.value = shared._proxyRecursive(this, clone(opts.defaultValue), '/');
			this.log.replicants('Declared "%s" in namespace "%s" with defaultValue:\n', name, namespace, opts.defaultValue);
			replicator.saveReplicant(this);
		}

		// Prevents one-time change listeners from potentially being called twice.
		// https://github.com/nodecg/nodecg/issues/296
		const originalOnce = this.once.bind(this);
		this.once = (event, listener) => {
			if (event === 'change' && replicator.declaredReplicants[namespace][name]) {
				return listener(this.value);
			}

			return originalOnce(event, listener);
		};

		/* When a new "change" listener is added, chances are that the developer wants it to be initialized ASAP.
		 * However, if this replicant has already been declared previously in this context, their "change"
		 * handler will *not* get run until another change comes in, which may never happen for Replicants
		 * that change very infrequently.
		 * To resolve this, we immediately invoke all new "change" handlers if appropriate.
		 */
		this.on('newListener', (event, listener) => {
			if (event === 'change' && replicator.declaredReplicants[namespace][name]) {
				listener(this.value);
			}
		});

		this._requestSaveReplicant = throttle(
			() => replicator.saveReplicant(this),
			this.opts.persistenceInterval,
		);

		return this;
	}

	/* eslint-enable constructor-super */

	/**
	 * Adds an operation to the operation queue, to be flushed at the end of the current tick.
	 * @param path {string} - The object path to where this operation took place.
	 * @param method {string} - The name of the operation.
	 * @param args {array} - The arguments provided to this operation
	 * @private
	 */
	_addOperation(path, method, args) {
		this._operationQueue.push({
			path,
			method,
			args
		});

		if (!this._pendingOperationFlush) {
			this._oldValue = clone(this.value);
			this._pendingOperationFlush = true;
			process.nextTick(() => this._flushOperations());
		}
	}

	/**
	 * Emits all queued operations via Socket.IO & empties this._operationQueue.
	 * @private
	 */
	_flushOperations() {
		this._pendingOperationFlush = false;
		this.revision++;
		replicator.emitToClients(this.namespace, 'replicant:operations', {
			name: this.name,
			namespace: this.namespace,
			operations: this._operationQueue,
			revision: this.revision
		});
		this._requestSaveReplicant();
		this.emit('change', this.value, this._oldValue, this._operationQueue);
		this._operationQueue = [];
	}
}

module.exports = Replicant;
