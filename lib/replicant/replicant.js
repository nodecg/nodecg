'use strict';

const path = require('path');
const sha1 = require('sha1');
const fs = require('fs');
const EventEmitter = require('events');
const LocalStorage = require('node-localstorage').LocalStorage;
const clone = require('clone');
const schemaDefaults = require('json-schema-defaults');
const replicator = require('../replicator');
const shared = require('./shared');
const $RefParser = require('json-schema-ref-parser');
const sleep = require('deasync').sleep;
const REPLICANTS_ROOT = path.join(process.env.NODECG_ROOT, 'db/replicants');

const REPLICANT_HANDLER = {
	get(target, prop) {
		return target[prop];
	},

	set(target, prop, newValue) {
		if (prop !== 'value' || target._ignoreProxy) {
			target[prop] = newValue;
			return true;
		}

		if (newValue === target[prop]) {
			target.log.replicants('value unchanged, no action will be taken');
			return true;
		}

		target.validate(newValue);
		target.log.replicants('running setter with', newValue);
		replicator.assign(target, newValue);
		return true;
	}
};

class Replicant extends EventEmitter {
	/* eslint-disable constructor-super */
	constructor(name, namespace, opts = {}) {
		if (!name || typeof name !== 'string') {
			throw new Error('Must supply a name when instantiating a Replicant');
		}

		if (!namespace || typeof namespace !== 'string') {
			throw new Error('Must supply a namespace when instantiating a Replicant');
		}

		super();

		// Load logger
		this.log = require('../logger')(`Replicant/${namespace}.${name}`);

		// If replicant already exists, return that.
		if ({}.hasOwnProperty.call(replicator.declaredReplicants, namespace)) {
			if ({}.hasOwnProperty.call(replicator.declaredReplicants[namespace], name)) {
				this.log.replicants('Existing replicant found, returning that instead of creating a new one.');
				return replicator.declaredReplicants[namespace][name];
			}
		} else {
			replicator.declaredReplicants[namespace] = {};
		}

		if (typeof opts.persistent === 'undefined') {
			opts.persistent = true;
		}

		this.name = name;
		this.namespace = namespace;
		this.opts = opts;
		this.revision = 0;

		const thisProxy = new Proxy(this, REPLICANT_HANDLER);
		replicator.declaredReplicants[namespace][name] = thisProxy;

		this._operationQueue = [];

		// Assign a stub so that `validate` can still be freely called even if there's no schema. Less checking to do.
		this.validate = function () {
			return true;
		};

		// If present, parse the schema and generate the validator function.
		if (opts.schemaPath) {
			const absoluteSchemaPath = path.isAbsolute(opts.schemaPath) ?
				opts.schemaPath :
				path.join(process.env.NODECG_ROOT, opts.schemaPath);
			if (fs.existsSync(absoluteSchemaPath)) {
				try {
					let sleepCount = 0;
					let refParserDone = false;
					let refParserError;
					let refParsedSchema;
					$RefParser.dereference(absoluteSchemaPath, {
						dereference: {
							circular: false
						}
					}, (err, schema) => {
						refParserDone = true;
						refParserError = err;
						refParsedSchema = schema;
					});

					while (!refParserDone) { // eslint-disable-line no-unmodified-loop-condition
						if (sleepCount > 150) {
							replicator.declaredReplicants[namespace][name] = null;
							throw new Error(`Failed to dereference schema for ${this.namespace}:${this.name} after 150 sleep cycles.`);
						}

						sleep(10);
						sleepCount++;
					}

					if (refParserError) {
						throw refParserError;
					}

					this.schema = refParsedSchema;
					this.schemaSum = sha1(this.schema);
					this.validate = shared.generateValidator(this);
				} catch (e) {
					this.log.error('Schema could not be loaded, are you sure that it is valid JSON?\n', e.stack);
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
				if (typeof opts.defaultValue === 'undefined') {
					opts.defaultValue = schemaDefaults(this.schema);
				} else {
					this.validate(opts.defaultValue);
				}
			}

			this.value = shared._proxyRecursive(this, opts.defaultValue, '/');
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

		return thisProxy;
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
		replicator.saveReplicant(this);
		this.emit('change', this.value, this._oldValue, this._operationQueue);
		this._operationQueue = [];
	}
}

module.exports = Replicant;
