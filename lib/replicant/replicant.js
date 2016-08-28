'use strict';

const sha1 = require('sha1');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const LocalStorage = require('node-localstorage').LocalStorage;
const clone = require('clone');
const validator = require('is-my-json-valid');
const schemaDefaults = require('json-schema-defaults');
const replicator = require('../replicator');
const shared = require('./shared');

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

		target.validate();
		target.log.replicants('running setter with', newValue);
		replicator.assign(target, newValue);
		return true;
	}
};

class Replicant extends EventEmitter {
	/* eslint-disable constructor-super */
	constructor(name, bundle, opts = {}) {
		if (!name || typeof name !== 'string') {
			throw new Error('Must supply a name when instantiating a Replicant');
		}

		if (!bundle || typeof bundle !== 'string') {
			throw new Error('Must supply a bundle name when instantiating a Replicant');
		}

		super();

		// Load logger
		this.log = require('../logger')(`Replicant/${bundle}.${name}`);

		// If replicant already exists, return that.
		if ({}.hasOwnProperty.call(replicator.declaredReplicants, bundle)) {
			if ({}.hasOwnProperty.call(replicator.declaredReplicants[bundle], name)) {
				this.log.replicants('Existing replicant found, returning that instead of creating a new one.');
				return replicator.declaredReplicants[bundle][name];
			}
		} else {
			replicator.declaredReplicants[bundle] = {};
		}

		if (typeof opts.persistent === 'undefined') {
			opts.persistent = true;
		}

		this.name = name;
		this.bundle = bundle;
		this.opts = opts;
		this.revision = 0;

		this._operationQueue = [];

		// If present, parse the schema and generate the validator function.
		const schemaPath = path.join('bundles', bundle, 'schemas', `${this.name}.json`);
		if (fs.existsSync(schemaPath)) {
			try {
				const rawSchema = fs.readFileSync(schemaPath);
				this.schema = JSON.parse(rawSchema);
				this.schemaSum = sha1(rawSchema);
				const validate = validator(this.schema, {greedy: true});

				/**
				 * Validates a value against the current Replicant's schema.
				 * Throws when the value fails validation.
				 * @param [value=this.value] {*} - The value to validate. Defaults to the replicant's current value.
				 * @param [opts] {Object}
				 * @param [opts.throwOnInvalid = true] {Boolean} - Whether or not to immediately throw when the provided value fails validation against the schema.
				 */
				this.validate = function (value = this.value, {throwOnInvalid = true} = {}) {
					const result = validate(value);
					if (throwOnInvalid && !result) {
						let errorMessage = `Invalid value for replicant "${this.name}" in bundle "${this.bundle}" rejected:\n`;
						const errors = validate.errors;
						errors.forEach(error => {
							const field = error.field.replace('data.', '');
							errorMessage += `\t${field} ${error.message}\n`;
						});
						throw new Error(errorMessage);
					}

					return result;
				};
			} catch (e) {
				this.log.error('Schema could not be loaded, are you sure that it is valid JSON?');
				this.log.error(e.stack);
			}
		} else {
			// Assign a stub so that the function can still be freely called even if there's no schema. Less checking to do.
			this.validate = function () {
				return true;
			};
		}

		// Initialize the storage object if not present
		if (!{}.hasOwnProperty.call(replicator.stores, bundle)) {
			replicator.stores[bundle] = new LocalStorage(`./db/replicants/${bundle}`);
		}

		// Get the existing value, if any, and JSON parse if its an object
		let existingValue = replicator.stores[bundle].getItem(`${name}.rep`);
		try {
			existingValue = JSON.parse(existingValue);
		} catch (e) {}

		if (name === 'schemaPersistencePass') {
			console.log('existingValue', existingValue);
		}

		// If `opts.persistent` is true and this bundle has a persisted value, try to load that persisted value.
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
			this.log.replicants('Declared "%s" in bundle "%s" with defaultValue:\n', name, bundle, opts.defaultValue);
			replicator.saveReplicant(this);
		}

		/* When a new "change" listener is added, chances are that the developer wants it to be initialized ASAP.
		 * However, if this replicant has already been declared previously in this context, their "change"
		 * handler will *not* get run until another change comes in, which may never happen for Replicants
		 * that change very infrequently.
		 * To resolve this, we immediately invoke all new "change" handlers if appropriate.
		 */
		this.on('newListener', (event, listener) => {
			if (event === 'change' && replicator.declaredReplicants[bundle][name]) {
				listener(this.value);
			}
		});

		const thisProxy = new Proxy(this, REPLICANT_HANDLER);
		replicator.declaredReplicants[bundle][name] = thisProxy;
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
		replicator.emitToClients(this.bundle, 'replicant:operations', {
			name: this.name,
			bundle: this.bundle,
			operations: this._operationQueue,
			revision: this.revision
		});
		replicator.saveReplicant(this);
		this.emit('change', this.value, this._oldValue, this._operationQueue);
		this._operationQueue = [];
	}
}

module.exports = Replicant;
