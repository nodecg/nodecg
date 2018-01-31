'use strict';

const path = require('path');
const fs = require('fs.extra');
const clone = require('clone');
const log = require('./logger')('replicator');
const server = require('./server');
const shared = require('./replicant/shared');
const REPLICANTS_ROOT = path.join(process.env.NODECG_ROOT, 'db/replicants');
const io = server.getIO();
const declaredReplicants = {};
const stores = {};

// Make 'db/replicants' folder if it doesn't exist
if (!fs.existsSync(REPLICANTS_ROOT)) {
	fs.mkdirpSync(REPLICANTS_ROOT);
}

module.exports = {
	declare,
	assign,
	applyOperations,
	find,
	findOrDeclare,
	emitToClients,
	saveReplicant,
	declaredReplicants,
	stores
};

server.on('started', () => {
	io.sockets.on('connection', socket => {
		socket.on('replicant:declare', (data, cb) => {
			log.replicants('received replicant:declare', data);
			try {
				const replicant = findOrDeclare(data.name, data.namespace, data.opts);
				if (typeof cb === 'function') {
					cb({
						value: replicant.value,
						revision: replicant.revision,
						schema: replicant.schema,
						schemaSum: replicant.schemaSum
					});
				}
			} catch (e) {
				if (e.message.startsWith('Invalid value rejected for replicant')) {
					if (typeof cb === 'function') {
						cb({
							rejectReason: e.message
						});
					}
				} else {
					throw e;
				}
			}
		});

		socket.on('replicant:proposeAssignment', (data, cb) => {
			log.replicants('received replicant:proposeAssignment', data);
			const serverReplicant = findOrDeclare(data.name, data.namespace, data.opts);

			if (data.schemaSum !== serverReplicant.schemaSum && typeof cb === 'function') {
				cb({
					rejectReason: 'Mismatched schema version, assignment rejected',
					schema: serverReplicant.schema,
					schemaSum: serverReplicant.schemaSum
				});
			}

			assign(serverReplicant, data.value);
		});

		socket.on('replicant:proposeOperations', (data, cb = function () {}) => {
			log.replicants('received replicant:proposeOperations', data);
			const serverReplicant = findOrDeclare(data.name, data.namespace, data.opts);
			if (serverReplicant.schema && data.schemaSum !== serverReplicant.schemaSum) {
				log.replicants(
					'Change request %s:%s had mismatched schema sum (ours %s, theirs %s), invoking callback with new schema and fullupdate',
					data.namespace, data.name, serverReplicant.schemaSum, data.schemaSum
				);
				cb({
					rejectReason: 'Mismatched schema version, assignment rejected',
					schema: serverReplicant.schema,
					schemaSum: serverReplicant.schemaSum,
					value: serverReplicant.value,
					revision: serverReplicant.revision
				});
			} else if (serverReplicant.revision !== data.revision) {
				log.replicants(
					'Change request %s:%s had mismatched revision (ours %s, theirs %s), invoking callback with fullupdate',
					data.namespace, data.name, serverReplicant.revision, data.revision
				);
				cb({
					rejectReason: 'Mismatched revision number, assignment rejected',
					value: serverReplicant.value,
					revision: serverReplicant.revision
				});
			}

			applyOperations(serverReplicant, data.operations);
		});

		socket.on('replicant:read', (data, cb) => {
			log.replicants('replicant:read', data);
			const replicant = find(data.name, data.namespace);
			if (typeof cb === 'function') {
				if (replicant) {
					cb(replicant.value);
				} else {
					cb();
				}
			}
		});
	});
});

/**
 * Declares a Replicant.
 * @param {string} name - The name of the Replicant to declare.
 * @param {string} namespace - The namespace to which this Replicant belongs.
 * @param {object} [opts] - The options for this replicant.
 * @param {*} [opts.defaultValue] - The default value to instantiate this Replicant with. The default value is only
 * applied if this Replicant has not previously been declared and if it has no persisted value.
 * @param {boolean} [opts.persistent=true] - Whether to persist the Replicant's value to disk on every change.
 * Persisted values are re-loaded on startup.
 * @param {string} [opts.schemaPath] - The filepath at which to look for a JSON Schema for this Replicant.
 * Defaults to `nodecg/bundles/${bundleName}/schemas/${replicantName}.json`.
 * @returns {object}
 */
function declare(name, namespace, opts) {
	// Delay requiring the Replicant class until here, otherwise cryptic errors are thrown. Not sure why!
	const Replicant = require('./replicant');
	return new Replicant(name, namespace, opts);
}

/**
 * Assigns a new value to a Replicant.
 * @param replicant {object} - The Replicant to assign.
 * @param value {*} - The new value to assign.
 */
function assign(replicant, value) {
	const oldValue = replicant.value;
	replicant._ignoreProxy = true;
	replicant.__value = shared._proxyRecursive(replicant, value, '/');
	replicant._ignoreProxy = false;
	replicant.revision++;
	replicant.emit('change', value, oldValue);

	replicant.log.replicants('Assigned:', value);

	emitToClients(replicant.namespace, 'replicant:assignment', {
		name: replicant.name,
		namespace: replicant.namespace,
		newValue: value,
		revision: replicant.revision
	});

	saveReplicant(replicant);
}

/**
 * Applies an array of operations to a replicant.
 * @param replicant {object} - The Replicant to perform these operation on.
 * @param operations {array} - An array of operations.
 */
function applyOperations(replicant, operations) {
	const oldValue = clone(replicant.value);
	operations.forEach(operation => shared.applyOperation(replicant, operation));
	replicant.revision++;
	replicant.emit('change', replicant.value, oldValue, operations);

	emitToClients(replicant.namespace, 'replicant:operations', {
		name: replicant.name,
		namespace: replicant.namespace,
		revision: replicant.revision,
		operations
	});

	saveReplicant(replicant);
}

/**
 * Finds a Replicant, returns undefined if not found.
 * @param name {string} - The name of the Replicant to find.
 * @param namespace {string} - The namespace in which to search.
 * @returns {*}
 */
function find(name, namespace) {
	// If there are no replicants for that namespace, return undefined
	if (!{}.hasOwnProperty.call(declaredReplicants, namespace)) {
		return undefined;
	}

	// If that replicant doesn't exist for that namespace, return undefined
	if (!{}.hasOwnProperty.call(declaredReplicants[namespace], name)) {
		return undefined;
	}

	// Return the replicant.
	return declaredReplicants[namespace][name];
}

/**
 * Finds or declares a Replicant. If a Replicant with the given `name` is already present in `namespace`,
 * returns that existing Replicant. Else, declares a new Replicant.
 * @param name {string} - The name of the Replicant.
 * @param namespace {string} - The namespace that the Replicant belongs to.
 * @param {object} [opts] - The options for this replicant.
 * @param {*} [opts.defaultValue] - The default value to instantiate this Replicant with. The default value is only
 * applied if this Replicant has not previously been declared and if it has no persisted value.
 * @param {boolean} [opts.persistent=true] - Whether to persist the Replicant's value to disk on every change.
 * Persisted values are re-loaded on startup.
 * @param {string} [opts.schemaPath] - The filepath at which to look for a JSON Schema for this Replicant.
 * Defaults to `nodecg/bundles/${bundleName}/schemas/${replicantName}.json`.
 */
function findOrDeclare(name, namespace, opts) {
	const existingReplicant = find(name, namespace);
	if (typeof existingReplicant !== 'undefined') {
		return existingReplicant;
	}

	return declare(name, namespace, opts);
}

/**
 * Emits an event to all remote Socket.IO listeners.
 * @param namespace {string} - The namespace in which to emit this event. Only applies to Socket.IO listeners.
 * @param eventName {string} - The name of the event to emit.
 * @param data {*} - The data to emit with the event.
 */
function emitToClients(namespace, eventName, data) {
	// Emit to clients (in the given namespace's room) using Socket.IO
	log.replicants('emitting %s to %s:', eventName, namespace, data);
	io.to(`replicant:${namespace}`).emit(eventName, data);
}

const _pendingSave = new Set();
/**
 * Persists a Replicant to disk. Does nothing if that Replicant has `persistent: false`.
 * Delays saving until the end of the current task, and de-dupes save commands run multiple times
 * during the same task.
 * @param replicant {object} - The Replicant to save.
 */
function saveReplicant(replicant) {
	if (!replicant.opts.persistent) {
		return;
	}

	if (_pendingSave.has(replicant)) {
		return;
	}

	_pendingSave.add(replicant);
	replicant.log.replicants('Will persist value at end of current tick.');

	process.nextTick(() => {
		_pendingSave.delete(replicant);

		if (!replicant.opts.persistent) {
			return;
		}

		let value = replicant.value;
		if (typeof value === 'object') {
			value = JSON.stringify(value);
		} else if (typeof value === 'undefined') {
			value = '';
		}

		try {
			stores[replicant.namespace].setItem(`${replicant.name}.rep`, value);
			replicant.log.replicants('Value successfully persisted.');
		} catch (error) {
			replicant.log.error('Failed to persist value:', error);
		}
	});
}
