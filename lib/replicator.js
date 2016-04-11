'use strict';

const fs = require('fs');
const EventEmitter = require('events');
const clone = require('clone');
const LocalStorage = require('node-localstorage').LocalStorage;
const log = require('./logger')('replicator');
const server = require('./server');
const shared = require('./replicant/shared');
const io = server.getIO();
const replicants = {};
const stores = {};

module.exports = exports = new EventEmitter();
exports.setMaxListeners(9999);

// Make 'db/replicants' folder if it doesn't exist
if (!fs.existsSync('db/replicants')) {
	fs.mkdirSync('db/replicants');
}

server.on('started', () => {
	io.sockets.on('connection', socket => {
		socket.on('replicant:declare', (data, cb) => {
			log.replicants('replicant:declare', data);
			const returnVal = findOrDeclare(data.name, data.bundle, data.defaultValue, data.persistent);
			if (typeof cb === 'function') {
				cb(returnVal);
			}
		});

		socket.on('replicant:assignment', data => {
			log.replicants('replicant:assignment', data);
			assign(data.name, data.bundle, data.value, data.originatorId);
		});

		socket.on('replicant:operations', (data, cb) => {
			log.replicants('replicant:operations', data);
			const current = find(data.name, data.bundle);
			if (current && current.revision !== data.revision) {
				log.replicants('Change request %s:%s had mismatched revision (ours %s, theirs %s), ' +
					'invoking callback with fullupdate',
					data.bundle, data.name, current.revision, data.revision);
				if (typeof cb === 'function') {
					cb(current.value, current.revision);
				}
			} else {
				applyOperations(data.name, data.bundle, data.changes, data.originatorId);
			}
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
	// Initialize the parent object if not present
	if (!replicants.hasOwnProperty(bundle)) {
		replicants[bundle] = {};
	}

	// Initialize the storage object if not present
	if (!stores.hasOwnProperty(bundle)) {
		stores[bundle] = new LocalStorage(`./db/replicants/${bundle}`);
	}

	// Get the existing value, if any, and JSON parse if its an object
	let existingValue = stores[bundle].getItem(`${name}.rep`);
	try {
		existingValue = JSON.parse(existingValue);
	} catch (e) {}

	if (persistent && typeof existingValue !== 'undefined' && existingValue !== null) {
		replicants[bundle][name] = {
			value: existingValue,
			revision: 0,
			persistent
		};
		log.replicants('Replicant "%s.%s" discovered in localStorage, loaded existing value:',
			bundle, name, existingValue);
	} else {
		replicants[bundle][name] = {
			value: defaultValue,
			revision: 0,
			persistent
		};
		saveReplicant(name, bundle, defaultValue);
		log.replicants('Replicant "%s.%s" declared:', bundle, name, defaultValue);
	}

	emitToAll(bundle, 'replicant:declared', {
		name,
		bundle,
		value: replicants[bundle][name].value,
		revision: replicants[bundle][name].revision,
		persistent
	});

	return replicants[bundle][name];
}

/**
 * Assigns a new value to a Replicant.
 * @param name {string} - The name of the Replicant to assign.
 * @param bundle {string} - The name of the bundle to which this Replicant belongs.
 * @param value {*} - The new value to assign.
 * @param originatorId {string} - The ID of the Replicant instance that originated this request.
 */
function assign(name, bundle, value, originatorId) {
	if (!exists(name, bundle)) {
		log.error('Attempted to assign non-existent replicant "%s.%s"', bundle, name);
		return;
	}

	const oldValue = replicants[bundle][name].value;
	replicants[bundle][name].value = value;
	replicants[bundle][name].revision++;

	log.replicants('Replicant "%s.%s" assigned:', bundle, name, value);

	emitToAll(bundle, 'replicant:assignment', {
		name,
		bundle,
		newValue: value,
		oldValue,
		revision: replicants[bundle][name].revision,
		originatorId
	});

	saveReplicant(name, bundle, value);
}

/**
 * Applies an array of operations to a replicant.
 * @param name {string} - The name of the Replicant to apply the operations to.
 * @param bundle {string} - The name of the bundle to which this Replicant belongs.
 * @param operations {array} - An array of operations.
 * @param originatorId {string} - The ID of the Replicant instance that originated this request.
 */
function applyOperations(name, bundle, operations, originatorId) {
	if (!exists(name, bundle)) {
		log.error('Attempted to change non-existent replicant "%s.%s"', bundle, name);
		return;
	}

	const rep = replicants[bundle][name];
	const oldValue = clone(rep.value);
	operations.forEach(operation => shared.applyOperation(rep, operation));
	replicants[bundle][name].revision++;

	emitToAll(bundle, 'replicant:operations', {
		name,
		bundle,
		newValue: rep.value,
		oldValue,
		revision: replicants[bundle][name].revision,
		operations,
		originatorId
	});

	saveReplicant(name, bundle, replicants[bundle][name].value);
}

/**
 * Whether or not a Replicant with a given `name` exists in `bundle`.
 * @param name {string} - The name of the Replicant to find.
 * @param bundle {string} - The name of the bundle in which to search.
 * @returns {boolean}
 */
function exists(name, bundle) {
	if (!replicants.hasOwnProperty(bundle)) {
		return false;
	}

	return replicants[bundle].hasOwnProperty(name);
}

/**
 * Finds a Replicant, returns undefined if not found.
 * @param name {string} - The name of the Replicant to find.
 * @param bundle {string} - The name of the bundle in which to search.
 * @returns {*}
 */
function find(name, bundle) {
	// If there are no variables for that bundle, return undefined
	if (!replicants.hasOwnProperty(bundle)) {
		return undefined;
	}

	// If that variable doesn't exist for that bundle, return undefined
	if (!replicants[bundle].hasOwnProperty(name)) {
		return undefined;
	}

	// Return the variable's current value
	return replicants[bundle][name];
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
		log.replicants('Replicant %s (%s) already existed:', name, bundle, existingReplicant);
		return existingReplicant;
	}

	return declare(name, bundle, defaultValue, persistent);
}

/**
 * Emits an event to all local EventEmitter listeners and all remote Socket.IO listeners.
 * @param bundle {string} - The bundle namespace in which to emit this event. Only applies to Socket.IO listeners.
 * @param eventName {string} - The name of the event to emit.
 * @param data {*} - The data to emit with the event.
 */
function emitToAll(bundle, eventName, data) {
	// Emit to extensions using EventEmitter
	exports.emit(eventName, data);

	// Emit to clients (in the given bundle's room) using Socket.IO
	log.replicants('emitting %s to %s:', eventName, bundle, data);
	io.to(bundle).emit(eventName, data);
}

const _pendingSave = {};
/**
 * Persists a Replicant to disk. Does nothing if that Replicant has `persistent: false`.
 * Delays saving until the end of the current task, and de-dupes save commands run multiple times
 * during the same task.
 * @param name {string} - The name of the Replicant to save.
 * @param bundle {string} - The name of the bundle that the Replicant belongs to.
 * @param value {*} - The value to save.
 */
function saveReplicant(name, bundle, value) {
	if (!replicants[bundle][name].persistent) {
		return;
	}

	if (!_pendingSave[bundle]) {
		_pendingSave[bundle] = {};
	}

	if (_pendingSave[bundle][name]) {
		return;
	}

	_pendingSave[bundle][name] = true;
	process.nextTick(() => {
		_pendingSave[bundle][name] = false;

		if (!replicants[bundle][name].persistent) {
			return;
		}

		if (typeof value === 'object') {
			value = JSON.stringify(value);
		} else if (typeof value === 'undefined') {
			value = '';
		}

		stores[bundle].setItem(`${name}.rep`, value);
	});
}

exports.declare = declare;
exports.assign = assign;
exports.applyOperations = applyOperations;
exports.exists = exists;
exports.find = find;
exports.findOrDeclare = findOrDeclare;
exports.emitToAll = emitToAll;
exports.saveReplicant = saveReplicant;
exports.replicants = replicants;
