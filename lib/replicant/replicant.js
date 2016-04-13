'use strict';

const EventEmitter = require('events');
const uuid = require('uuid');
const LocalStorage = require('node-localstorage').LocalStorage;
const replicator = require('../replicator');

const REPLICANT_HANDLER = {
	get(target, prop) {
		return target[prop];
	},

	set(target, prop, newValue) {
		if (prop !== 'value') {
			throw new Error('All Replicant properties (with the exception of "value") are read-only');
		}

		if (target._ignoreProxy__) {
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

		// If replicant already exists, return that.
		if (replicator.declaredReplicants.hasOwnProperty(bundle)) {
			if (replicator.declaredReplicants[bundle].hasOwnProperty(name)) {
				return replicator.declaredReplicants[bundle][name];
			}
		} else {
			replicator.declaredReplicants[bundle] = {};
		}

		super();
		replicator.declaredReplicants[bundle][name] = this;

		// Load logger
		this.log = require('../logger')(`Replicant/${bundle}.${name}`);

		opts = opts || {};
		this.value = opts.defaultValue;
		this.name = name;
		this.bundle = bundle;
		this.opts = opts;
		this.id = uuid.v4();
		this.revision = 0;
		if (typeof opts.persistent === 'undefined') {
			opts.persistent = true;
		}

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
			replicator.declaredReplicants[bundle][name].value = existingValue;
			this.log.replicants('Persisted value loaded from localStorage:', existingValue);
		} else {
			replicator.saveReplicant(this);
			this.log.replicants('Declared:', bundle, name, opts.defaultValue);
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

		return new Proxy(this, REPLICANT_HANDLER);
	}
	/* eslint-enable constructor-super */
}

module.exports = Replicant;
