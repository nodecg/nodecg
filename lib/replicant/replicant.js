'use strict';

const EventEmitter = require('events');
const uuid = require('uuid');
const replicator = require('../replicator');
const declaredReplicants = {};

const REPLICANT_HANDLER = {
	get(target, prop) {
		if (prop === 'value') {
			return replicator.replicants[target.bundle][target.name].value;
		}

		return target[prop];
	},

	set(target, prop, newValue) {
		if (prop !== 'value') {
			throw new Error('All Replicant properties (with the exception of "value") are read-only');
		}

		if (newValue === target[prop]) {
			target.log.replicants('value unchanged, no action will be taken');
			return target.value;
		}

		target.log.replicants('running setter with', newValue);
		replicator.assign(target.name, target.bundle, newValue, target.id);
		return replicator.replicants[target.bundle][target.name].value;
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
		if (declaredReplicants.hasOwnProperty(bundle)) {
			if (declaredReplicants[bundle].hasOwnProperty(name)) {
				return declaredReplicants[bundle][name];
			}
		} else {
			declaredReplicants[bundle] = {};
		}

		super();
		declaredReplicants[bundle][name] = this;

		// Load logger
		this.log = require('../logger')(`Replicant/${bundle}.${name}`);

		opts = opts || {};
		this.name = name;
		this.bundle = bundle;
		this.opts = opts;
		this.id = uuid.v4();
		if (typeof opts.persistent === 'undefined') {
			opts.persistent = true;
		}

		/* When a new "change" listener is added, chances are that the developer wants it to be initialized ASAP.
		 * However, if this replicant has already been declared previously in this context, their "change"
		 * handler will *not* get run until another change comes in, which may never happen for Replicants
		 * that change very infrequently.
		 * To resolve this, we immediately invoke all new "change" handlers if appropriate.
		 */
		this.on('newListener', (event, listener) => {
			if (event === 'change' && declaredReplicants[bundle][name]) {
				listener(this.value);
			}
		});

		// Declare and observe default
		replicator.findOrDeclare(name, bundle, opts.defaultValue, opts.persistent);

		replicator.on('replicant:assignment', data => {
			this._handleAssignmentAndOperations('replicant:assignment', data);
		});

		replicator.on('replicant:operations', data => {
			this._handleAssignmentAndOperations('replicant:operations', data);
		});

		return new Proxy(this, REPLICANT_HANDLER);
	}
	/* eslint-enable constructor-super */

	/**
	 * The Replicator takes care of pretty much everything for assignment and operation,
	 * we just need to emit a change event for listeners of this Replicant to hear.
	 * @param type {string} - Just used to format the logs.
	 * @param data {object} - The properties of the Assignment or Operations that were applied.
	 * @private
	 */
	_handleAssignmentAndOperations(type, data) {
		if (data.name !== this.name || data.bundle !== this.bundle) {
			return;
		}

		this.log.replicants(type, data);
		this.emit('change', data.newValue, data.oldValue, data.operations);
	}
}

module.exports = Replicant;
