'use strict';

const fs = require('fs');
const clone = require('clone');
const log = require('./logger')('replicator');
const server = require('./server');
const shared = require('./replicant/shared');
const io = server.getIO();
const declaredReplicants = {};
const stores = {};

// Make 'db/replicants' folder if it doesn't exist
if (!fs.existsSync('db/replicants')) {
	fs.mkdirSync('db/replicants');
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
				const replicant = findOrDeclare(data.name, data.bundle, data.defaultValue, data.persistent);
				if (typeof cb === 'function') {
					cb({
						value: replicant.value,
						revision: replicant.revision,
						schema: replicant.schema,
						schemaSum: replicant.schemaSum
					});
				}
			} catch (e) {
				if (e.message.startsWith('Invalid value for replicant')) {
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
			const serverReplicant = findOrDeclare(data.name, data.bundle, undefined, data.persistent);

			if (data.schemaSum !== serverReplicant.schemaSum && typeof cb === 'function') {
				cb({
					errorMessage: 'Mismatched schema version, assignment rejected',
					schema: serverReplicant.schema,
					schemaSum: serverReplicant.schemaSum
				});
			}

			assign(serverReplicant, data.value);
		});

		socket.on('replicant:proposeOperations', (data, cb = function () {}) => {
			log.replicants('received replicant:proposeOperations', data);
			const serverReplicant = findOrDeclare(data.name, data.bundle, undefined, data.persistent);
			if (serverReplicant.schema && data.schemaSum !== serverReplicant.schemaSum) {
				log.replicants('Change request %s:%s had mismatched schema sum (ours %s, theirs %s), ' +
					'invoking callback with new schema and fullupdate',
					data.bundle, data.name, serverReplicant.schemaSum, data.schemaSum);
				cb({
					rejectReason: 'Mismatched schema version, assignment rejected',
					schema: serverReplicant.schema,
					schemaSum: serverReplicant.schemaSum,
					value: serverReplicant.value,
					revision: serverReplicant.revision
				});
			} else if (serverReplicant.revision !== data.revision) {
				log.replicants('Change request %s:%s had mismatched revision (ours %s, theirs %s), ' +
					'invoking callback with fullupdate',
					data.bundle, data.name, serverReplicant.revision, data.revision);
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
			const replicant = find(data.name, data.bundle);
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
 * @param name {string} - The name of the Replicant to declare.
 * @param bundle {string} - The name of the bundle to which this Replicant belongs.
 * @param defaultValue {*} - The default value to assign to this Replicant, if it has no persisted value.
 * @param persistent {boolean} - Whether to persist this Replicant's value to disk after every change.
 * @returns {object}
 */
function declare(name, bundle, defaultValue, persistent) {
	// Delay requiring the Replicant class until here, otherwise cryptic errors are thrown. Not sure why!
	const Replicant = require('./replicant');
	return new Replicant(name, bundle, {
		defaultValue,
		persistent
	});
}

/**
 * Assigns a new value to a Replicant.
 * @param replicant {object} - The Replicant to assign.
 * @param value {*} - The new value to assign.
 */
function assign(replicant, value) {
	const oldValue = replicant.value;
	replicant._ignoreProxy = true;
	replicant.value = shared._proxyRecursive(replicant, value, '/');
	replicant._ignoreProxy = false;
	replicant.revision++;
	replicant.emit('change', value, oldValue);

	replicant.log.replicants('Assigned:', value);

	emitToClients(replicant.bundle, 'replicant:assignment', {
		name: replicant.name,
		bundle: replicant.bundle,
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

	emitToClients(replicant.bundle, 'replicant:operations', {
		name: replicant.name,
		bundle: replicant.bundle,
		revision: replicant.revision,
		operations
	});

	saveReplicant(replicant);
}

/**
 * Finds a Replicant, returns undefined if not found.
 * @param name {string} - The name of the Replicant to find.
 * @param bundle {string} - The name of the bundle in which to search.
 * @returns {*}
 */
function find(name, bundle) {
	// If there are no variables for that bundle, return undefined
	if (!{}.hasOwnProperty.call(declaredReplicants, bundle)) {
		return undefined;
	}

	// If that variable doesn't exist for that bundle, return undefined
	if (!{}.hasOwnProperty.call(declaredReplicants[bundle], name)) {
		return undefined;
	}

	// Return the variable's current value
	return declaredReplicants[bundle][name];
}

/**
 * Finds or declares a Replicant. If a Replicant with the given `name` is already present in `bundle`,
 * returns that existing Replicant. Else, declares a new Replicant.
 * @param name {string} - The name of the Replicant.
 * @param bundle {string} - The name of the bundle that the Replicant belongs to.
 * @param defaultValue {*} - The defaultValue to declare this Replicant with.
 * @param persistent {boolean} - Whether or not this Replicant should persist its value to disk.
 */
function findOrDeclare(name, bundle, defaultValue, persistent) {
	const existingReplicant = find(name, bundle);
	if (typeof existingReplicant !== 'undefined') {
		return existingReplicant;
	}

	return declare(name, bundle, defaultValue, persistent);
}

/**
 * Emits an event to all remote Socket.IO listeners.
 * @param bundle {string} - The bundle namespace in which to emit this event. Only applies to Socket.IO listeners.
 * @param eventName {string} - The name of the event to emit.
 * @param data {*} - The data to emit with the event.
 */
function emitToClients(bundle, eventName, data) {
	// Emit to clients (in the given bundle's room) using Socket.IO
	log.replicants('emitting %s to %s:', eventName, bundle, data);
	io.to(bundle).emit(eventName, data);
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

		stores[replicant.bundle].setItem(`${replicant.name}.rep`, value);
		replicant.log.replicants('Value successfully persisted.');
	});
}
