'use strict';

const EventEmitter = require('events');
const LocalStorage = require('node-localstorage').LocalStorage;
const clone = require('clone');
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

		target.log.replicants('running setter with', newValue);
		replicator.assign(target, newValue);
		return true;
	}
};

class Replicant extends EventEmitter {
	/* eslint-disable constructor-super */
	constructor(name, bundle, opts) {
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
		if (replicator.declaredReplicants.hasOwnProperty(bundle)) {
			if (replicator.declaredReplicants[bundle].hasOwnProperty(name)) {
				this.log.replicants('Existing replicant found, returning that instead of creating a new one.');
				return replicator.declaredReplicants[bundle][name];
			}
		} else {
			replicator.declaredReplicants[bundle] = {};
		}

		opts = opts || {};
		this.name = name;
		this.bundle = bundle;
		this.opts = opts;
		this.revision = 0;
		this.value = shared._proxyRecursive(this, opts.defaultValue, '/');
		if (typeof opts.persistent === 'undefined') {
			opts.persistent = true;
		}

		this._operationQueue = [];

		// Initialize the storage object if not present
		if (!replicator.stores.hasOwnProperty(bundle)) {
			replicator.stores[bundle] = new LocalStorage(`./db/replicants/${bundle}`);
		}

		// Get the existing value, if any, and JSON parse if its an object
		let existingValue = replicator.stores[bundle].getItem(`${name}.rep`);
		try {
			existingValue = JSON.parse(existingValue);
		} catch (e) {}

		if (opts.persistent && typeof existingValue !== 'undefined' && existingValue !== null) {
			this.value = shared._proxyRecursive(this, existingValue, '/');
			this.log.replicants('Loaded a persisted value from localStorage:', existingValue);
		} else {
			replicator.saveReplicant(this);
			this.log.replicants('Declared "%s" in bundle "%s" with defaultValue:\n', name, bundle, opts.defaultValue);
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
		this._operationQueue.push({path, method, args});

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
