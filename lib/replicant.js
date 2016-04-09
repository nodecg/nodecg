'use strict';

const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;
const Nested = require('nested-observe');
const objectPath = require('object-path');
const replicator = require('./replicator');
const io = require('./server').getIO();
const clone = require('clone');
const uuid = require('uuid');
const declaredReplicants = {};

// Make Replicant inherit the prototype of EventEmitter
inherits(Replicant, EventEmitter);
module.exports = Replicant;
Replicant.declaredReplicants = declaredReplicants;

function Replicant(name, bundle, opts) {
	if (!name || typeof name !== 'string') {
		throw new Error('Must supply a name when instantiating a Replicant');
	}

	if (!bundle || typeof bundle !== 'string') {
		throw new Error('Must supply a bundle name when instantiating a Replicant');
	}

	// Load logger
	const log = require('./logger')(`Replicant/${bundle}.${name}`);

	// If replicant already exists, return that.
	if (declaredReplicants.hasOwnProperty(bundle)) {
		if (declaredReplicants[bundle].hasOwnProperty(name)) {
			return declaredReplicants[bundle][name];
		}

		declaredReplicants[bundle][name] = this;
	} else {
		declaredReplicants[bundle] = {};
		declaredReplicants[bundle][name] = this;
	}

	const self = this;
	opts = opts || {};
	this.name = name;
	this.bundle = bundle;
	this.opts = opts;
	this.id = uuid.v4();
	if (typeof opts.persistent === 'undefined') {
		opts.persistent = true;
	}

	// When a new "change" listener is added, chances are that the developer wants it to be initialized ASAP.
	// However, if this replicant has already been declared previously in this context, their "change"
	// handler will *not* get run until another change comes in, which may never happen for Replicants
	// that change very infrequently.
	// To resolve this, we immediately invoke all new "change" handlers if appropriate.
	this.on('newListener', (event, listener) => {
		if (event === 'change' && declaredReplicants[bundle][name]) {
			listener(undefined, value());
		}
	});

	/* jshint -W093 */
	function value(newVal) {
		if (arguments.length >= 1) {
			replicator.replicants[bundle][name].value = newVal;
		}
		return replicator.replicants[bundle][name].value;
	}

	/* jshint +W093 */

	Object.defineProperty(this, 'value', {
		get() {
			return value();
		},
		set(newValue) {
			if (newValue === value()) {
				log.replicants('value unchanged, no action will be taken');
				return value();
			}

			log.replicants('running setter with', newValue);
			unobserveValue();
			replicator.assign(name, bundle, newValue);
			observeValue();
		},
		enumerable: true
	});

	// Declare and observe default
	replicator.findOrDeclare(name, bundle, opts.defaultValue, opts.persistent);
	observeValue();

	function observeValue() {
		if (typeof value() === 'object' && value() !== null) {
			Nested.observe(value(), onChangeObserved);
		}
	}

	function onChangeObserved(rawChanges) {
		const formattedChanges = [];
		rawChanges.forEach(change => {
			let path = change.path.substr(1).split('/').map(part => {
				// De-tokenize '/' characters in path name
				return part.replace(/~1/g, '/');
			});

			// For some reason, empty paths in array formats cause errors.
			// To prevent this, we replace the path with an empty string if this is the case.
			if (path.length === 1 && path[0] === '') {
				path = [];
			}

			const newVal = objectPath.get(change.root, path);
			switch (change.type) {
				case 'add':
					formattedChanges.push({
						type: 'add',
						path,
						newValue: newVal
					});
					break;
				case 'update':
					formattedChanges.push({
						type: 'update',
						path,
						oldValue: change.oldValue,
						newValue: newVal
					});
					break;
				case 'splice':
					formattedChanges.push({
						type: 'splice',
						path,
						index: change.index,
						removed: change.removed,
						removedCount: change.removed.length,
						added: change.object.slice(change.index, change.index + change.addedCount),
						addedCount: change.addedCount
					});
					break;
				case 'delete':
					formattedChanges.push({
						type: 'delete',
						path,
						oldValue: change.oldValue
					});
					break;
				default:
					formattedChanges.push({
						type: 'other',
						path
					});
			}
		});

		const oldValue = reverseChanges(value(), formattedChanges);

		// Increment revision
		replicator.replicants[bundle][name].revision++;

		// Emit oldVal, newVal, and changes directly to extension replicant `change` handlers
		self.emit('change', oldValue, value(), formattedChanges);

		// Persist to disk, if enabled for this replicant
		replicator.saveReplicant(name, bundle, value());

		// Emit only the raw changes to browser clients
		io.to(bundle).emit('replicantChanged', {
			name,
			bundle,
			revision: replicator.replicants[bundle][name].revision,
			changes: formattedChanges,
			originatorId: self.id
		});
	}

	function unobserveValue() {
		if (typeof value() === 'object' && value() !== null) {
			Nested.unobserve(value(), onChangeObserved);
		}
	}

	replicator.on('unobserveReplicant', (name, bundle) => {
		if (name === self.name && bundle === self.bundle) {
			unobserveValue();
		}
	});

	replicator.on('preReplicantAssigned', data => {
		if (data.name !== name || data.bundle !== bundle) {
			return;
		}

		log.replicants('preReplicantAssigned', data);
		unobserveValue();
	});

	// Handle assignment that overwrites the whole value
	replicator.on('replicantAssigned', data => {
		if (data.name !== name || data.bundle !== bundle) {
			return;
		}

		log.replicants('replicantAssigned', data);
		self.emit('change', data.oldValue, data.newValue);
		observeValue();
	});

	// The replicator has already determined the new value, so we just determine the old value.
	replicator.on('replicantChanged', data => {
		if (data.name !== name || data.bundle !== bundle) {
			return;
		}

		log.replicants('replicantChanged', data);

		const oldValue = reverseChanges(value(), data.changes);
		self.revision = data.revision;
		self.emit('change', oldValue, value(), data.changes);
		observeValue();
	});

	// Walk through changes in reverse, and do the opposite to calculate the old value
	function reverseChanges(startValue, changes) {
		const oldValue = clone(startValue);
		const reversedChanges = clone(changes).reverse();
		reversedChanges.forEach(change => {
			switch (change.type) {
				case 'add':
					objectPath.del(oldValue, change.path);
					break;
				case 'update':
					objectPath.set(oldValue, change.path, change.oldValue);
					break;
				case 'splice': {
					let arr = objectPath.get(oldValue, change.path);
					if (!arr) {
						arr = [];
					}
					const args = change.removed;
					args.unshift(change.addedCount);
					args.unshift(change.index);
					Array.prototype.splice.apply(arr, args);
					objectPath.set(oldValue, change.path, arr);
					break;
				}
				case 'delete':
					objectPath.set(oldValue, change.path, change.oldValue);
					break;
				default:
					objectPath.set(oldValue, change.path, change.oldValue);
			}
		});
		return oldValue;
	}
}
