/* eslint-env browser */
/* global NodeCG */
'use strict';

const EventEmitter = require('events');
const equal = require('deep-equal');
const clone = require('clone');
const shared = require('../replicant/shared');
const declaredReplicants = {};

const REPLICANT_HANDLER = {
	get(target, prop) {
		if (prop === 'value' && target.status !== 'declared') {
			target.log.warn('Attempted to get value before Replicant had finished declaring. ' +
				'This will always return undefined.');
		}

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

		if (target.status !== 'declared') {
			target._queueAction(target._proposeAssignment, [newValue]);
			return true;
		}

		target._proposeAssignment(newValue);
		return true;
	}
};

class Replicant extends EventEmitter {
	/* eslint-disable constructor-super */
	constructor(name, namespace, opts, socket) {
		if (!name || typeof name !== 'string') {
			throw new Error('Must supply a name when instantiating a Replicant');
		}

		if (!namespace || typeof namespace !== 'string') {
			throw new Error('Must supply a namespace when instantiating a Replicant');
		}

		super();

		// Load logger
		this.log = require('./logger')(`Replicant/${namespace}.${name}`);

		// If replicant already exists, return that.
		if ({}.hasOwnProperty.call(declaredReplicants, namespace)) {
			if ({}.hasOwnProperty.call(declaredReplicants[namespace], name)) {
				this.log.replicants('Existing replicant found, returning that instead of creating a new one.');
				return declaredReplicants[namespace][name];
			}
		} else {
			declaredReplicants[namespace] = {};
		}

		opts = opts || {};
		this.value = undefined;
		this.name = name;
		this.namespace = namespace;
		this.opts = opts;
		this.revision = 0;
		this.status = 'undeclared';
		this._socket = socket;

		if (typeof opts.persistent === 'undefined') {
			opts.persistent = true;
		}

		if (typeof opts.persistenceInterval === 'undefined') {
			opts.persistenceInterval = shared.DEFAULT_PERSISTENCE_INTERVAL;
		}

		// Prevents one-time change listeners from potentially being called twice.
		// https://github.com/nodecg/nodecg/issues/296
		const originalOnce = this.once.bind(this);
		this.once = (event, listener) => {
			if (event === 'change' && this.status === 'declared') {
				return listener(this.value);
			}

			return originalOnce(event, listener);
		};

		/* When a new "change" listener is added, chances are that the developer wants it to be initialized ASAP.
		 * However, if this Replicant has already been declared previously in this context, their "change"
		 * handler will *not* get run until another change comes in, which may never happen for Replicants
		 * that change very infrequently.
		 * To resolve this, we immediately invoke all new "change" handlers if appropriate.
		 */
		this.on('newListener', (event, listener) => {
			if (event === 'change' && this.status === 'declared') {
				listener(this.value);
			}
		});

		/* When running in the browser, we have to wait until the socket joins the room
		 * and the replicant is fully declared before running any additional commands.
		 * After this time, commands do not need to be added to the queue and are simply executed immediately.
		 */
		this._actionQueue = [];

		this._operationQueue = [];

		// Assign a stub so that the function can still be freely called even if there's no schema. Less checking to do.
		this.validate = function () {
			return true;
		};

		// Initialize the Replicant.
		this._declare();

		socket.on('replicant:assignment', data => this._handleAssignment(data));
		socket.on('replicant:operations', data => this._handleOperations(data));

		// If we lose connection, redeclare everything on reconnect
		socket.on('disconnect', () => this._handleDisconnect());
		socket.on('reconnect', () => this._declare());

		const thisProxy = new Proxy(this, REPLICANT_HANDLER);
		declaredReplicants[namespace][name] = thisProxy;
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
			this._pendingOperationFlush = true;

			if (this.status === 'declared') {
				process.nextTick(() => this._flushOperations());
			} else {
				this._queueAction(this._flushOperations);
			}
		}
	}

	/**
	 * Emits all queued operations via Socket.IO & empties this._operationQueue.
	 * @private
	 */
	_flushOperations() {
		this._pendingOperationFlush = false;
		this._socket.emit('replicant:proposeOperations', {
			name: this.name,
			namespace: this.namespace,
			operations: this._operationQueue,
			revision: this.revision,
			schemaSum: this.schemaSum,
			opts: this.opts
		}, data => {
			if (data.schema) {
				this.schema = data.schema;
				this.schemaSum = data.schemaSum;
			}

			if (data.revision && data.revision !== this.revision) {
				this.log.warn(
					'Not at head revision (ours %s, theirs %s). Change aborted & head revision applied.',
					this.revision, data.revision
				);
				this._assignValue(data.value, data.revision);
			}

			if (data.rejectReason) {
				if (this.listenerCount('operationsRejected') > 0) {
					this.emit('operationsRejected', data.rejectReason);
				} else {
					return this.log.error(data.rejectReason);
				}
			}
		});
		this._operationQueue = [];
	}

	/**
	 * Adds an "action" to the action queue. Actions are method calls on the Replicant object itself.
	 * @param fn
	 * @param args
	 * @private
	 */
	_queueAction(fn, args) {
		this._actionQueue.push({
			fn,
			args
		});
	}

	/**
	 * Emits "assignReplicant" via the socket.
	 * @param newValue
	 * @private
	 */
	_proposeAssignment(newValue) {
		this._socket.emit('replicant:proposeAssignment', {
			name: this.name,
			namespace: this.namespace,
			value: newValue,
			schemaSum: this.schemaSum,
			opts: this.opts
		}, data => {
			if (data.schema) {
				this.schema = data.schema;
				this.schemaSum = data.schemaSum;
			}

			if (data.rejectReason) {
				if (this.listenerCount('assignmentRejected') > 0) {
					this.emit('assignmentRejected', data.rejectReason);
				} else {
					throw new Error(data.rejectReason);
				}
			}
		});
	}

	/**
	 * Emits "declareReplicant" via the socket.
	 * @private
	 */
	_declare() {
		if (this.status === 'declared' || this.status === 'declaring') {
			return;
		}

		this.status = 'declaring';
		this._socket.emit('joinRoom', `replicant:${this.namespace}`, () => {
			this._socket.emit('replicant:declare', {
				name: this.name,
				namespace: this.namespace,
				opts: this.opts
			}, data => {
				if (data.rejectReason) {
					if (this.listenerCount('declarationRejected') > 0) {
						this.emit('declarationRejected', data.rejectReason);
					} else {
						throw new Error(data.rejectReason);
					}
				}

				this.log.replicants('declareReplicant callback (value: %s, revision: %s)', data.value, data.revision);
				this.status = 'declared';

				/* If the revision we get in the response doesn't match the revision we have locally,
				 * then we need to just assign the authoritative value we got back from the Replicator.
				 * Likewise, if our local value isn't an exact match to what we got back from the Replicator,
				 * just assume that the Replicator is correct and take the value it gave us.
				 */
				if (this.revision !== data.revision || !equal(this.value, data.value)) {
					this._assignValue(data.value, data.revision);
				}

				if (data.schema) {
					this.schema = data.schema;
					this.schemaSum = data.schemaSum;
					this.validate = shared.generateValidator(this);
				}

				// Let listeners know that this Replicant has been successfully declared.
				this.emit('declared', data);

				/* If a replicant is declared with no defaultValue and has not yet been given a value, then `change`
				 * listeners added before declaration has completed will not fire when declaration completes, because
				 * `undefined` === `undefined`, meaning that the above `_assignValue` call won't get run.
				 *
				 * To ensure consistent behavior, we manually emit a `change` event in this case.
				 */
				if (this.value === undefined && this.revision === 0) {
					this.emit('change');
				}

				// If there were any pre-declare actions queued, execute them.
				if (this._actionQueue.length > 0) {
					this._actionQueue.forEach(item => {
						item.fn.apply(this, item.args);
					});
					this._actionQueue = [];
				}
			});
		});
	}

	/**
	 * Overwrites the value completely, and assigns a new one.
	 * Does not send a `change` argument with the change event.
	 * @param newValue {*} - The value to assign.
	 * @param revision {number} - The new revision number.
	 * @private
	 */
	_assignValue(newValue, revision) {
		const oldValue = clone(this.value);

		this.value = shared._proxyRecursive(this, newValue, '/');

		if (typeof revision !== 'undefined') {
			this.revision = revision;
		}

		this.emit('change', this.value, oldValue);
	}

	/**
	 * Handles incoming assignment (completely overwriting the value of the Replicant with a new value).
	 * @param data {object} - Information about the assignment.
	 * @private
	 */
	_handleAssignment(data) {
		if (data.name !== this.name || data.namespace !== this.namespace) {
			return;
		}

		this.log.replicants('received replicantAssigned', data);
		this._assignValue(data.newValue, data.revision);
	}

	/**
	 * Handles incoming operations performed on Array and Object Replicants.
	 * Requests a fullUpdate if it determines that we're not at the latest revision of this Replicant.
	 * @param data {object} - A record of operations to perform.
	 * @private
	 */
	_handleOperations(data) {
		if (this.status !== 'declared') {
			return;
		}

		const expectedRevision = this.revision + 1;
		if (data.name !== this.name || data.namespace !== this.namespace) {
			return;
		}

		if (data.revision !== expectedRevision) {
			this.log.warn(
				'Not at head revision (ours: "%s", expected theirs to be "%s" but got "%s"), fetching latest...',
				this.revision, expectedRevision, data.revision
			);
			this._fullUpdate();
			return;
		}

		this.log.replicants('received replicantOperations', data);

		const oldValue = clone(this.value);
		data.operations.forEach(operation => {
			operation.result = shared.applyOperation(this, operation);
		});
		this.revision = data.revision;
		this.emit('change', this.value, oldValue, data.operations);
	}

	_handleDisconnect() {
		this.status = 'undeclared';
		this._operationQueue.length = 0;
		this._actionQueue.length = 0;
	}

	/**
	 * Requests the latest value from the Replicator, discarding the local value.
	 * @private
	 */
	_fullUpdate() {
		NodeCG.readReplicant(this.name, this.namespace, data => {
			this.emit('fullUpdate', data);
			this._assignValue(data.value, data.revision);
		});
	}

	/**
	 * A map of all Replicants declared in this context. Top-level keys are namespaces,
	 * child keys are Replicant names.
	 */
	static get declaredReplicants() {
		return declaredReplicants;
	}
}

module.exports = Replicant;
