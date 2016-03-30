/* eslint-env browser */
'use strict';

const inherits = require('inherits'); // Used instead of full `util` package for the sake of easier browserification
const EventEmitter = require('events').EventEmitter;
const Nested = require('nested-observe');
const objectPath = require('object-path');
const equal = require('deep-equal');
const clone = require('clone');
const uuid = require('uuid');
const declaredReplicants = {};

// Make Replicant inherit the prototype of EventEmitter
inherits(Replicant, EventEmitter);
module.exports = Replicant;
Replicant.declaredReplicants = declaredReplicants;

function Replicant(name, bundle, opts, socket) {
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
	let value;
	opts = opts || {};
	this.name = name;
	this.bundle = bundle;
	this.opts = opts;
	this.revision = 0;
	this.status = 'undeclared';
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
		if (event === 'change' && self.status === 'declared') {
			listener(undefined, value);
		}
	});

	// When running in the browser, we have to wait until the socket joins the room
	// and the replicant is fully declared before running any additional commands.
	// After this time, commands do not need to be added to the queue and are simply executed immediately.
	const queue = [];

	function addToQueue(fn, args) {
		queue.push({fn, args});
	}

	function processQueue() {
		queue.forEach(item => item.fn.apply(this, item.args));
	}

	Object.defineProperty(this, 'value', {
		get() {
			return value;
		},
		set(newValue) {
			if (newValue === value) {
				log.replicants('value unchanged, no action will be taken');
				return value;
			}

			log.replicants('running setter with', newValue);

			if (self.status !== 'declared') {
				addToQueue(doBrowserSetter, [newValue]);
				return undefined;
			}

			doBrowserSetter(newValue);
		},
		enumerable: true
	});

	function doBrowserSetter(newValue) {
		socket.emit('assignReplicant', {
			name,
			bundle,
			value: newValue,
			originatorId: self.id
		});
	}

	function doBrowserDeclare(defaultValue) {
		if (self.status === 'declared' || self.status === 'declaring') {
			return;
		}

		self.status = 'declaring';
		socket.emit('joinRoom', bundle, () => {
			socket.emit('declareReplicant', {
				name,
				bundle,
				defaultValue,
				persistent: opts.persistent
			}, data => {
				log.replicants('declareReplicant callback (value: %s, revision: %s)', data.value, data.revision);
				let didMismatchReassignment = false;
				if (self.revision !== data.revision || !equal(value, data.value)) {
					unobserveValue();
					value = defaultValue;
					observeValue();
					assignValue(data.value, data.revision);
					didMismatchReassignment = true;
				}
				self.status = 'declared';
				self.emit('declared', data);
				if (queue.length > 0) {
					processQueue();
				} else if (!didMismatchReassignment) {
					self.emit('change', undefined, data.value);
				}
			});
		});
	}

	doBrowserDeclare(opts.defaultValue);

	// Overwrites the value completely, and assigns a new one.
	// Does not send a `change` argument with the change event.
	function assignValue(newValue, revision) {
		unobserveValue();
		const oldValue = clone(value);
		value = newValue;
		observeValue();
		if (typeof revision !== 'undefined') {
			self.revision = revision;
		}
		self.emit('change', oldValue, value);
	}

	function observeValue() {
		if (typeof value === 'object' && value !== null) {
			Nested.observe(value, onValueChange);
		}
	}

	function dispatchChanges(changes) {
		socket.emit('changeReplicant', {
			name,
			bundle,
			changes,
			revision: self.revision,
			originatorId: self.id
		}, (value, revision) => {
			// This callback is only invoked in cases of failure
			log.replicants('Not at head revision (ours %s, theirs %s). Change aborted & head revision applied.',
				self.revision, revision);
			assignValue(value, revision);
		});
	}

	function onValueChange(rawChanges) {
		const formattedChanges = [];
		rawChanges.forEach(change => {
			let path = change.path.substr(1).split('/').map(part => {
				// De-tokenize '/' characters in path name
				return part.replace(/\~1/g, '/');
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

		if (self.status === 'declared') {
			dispatchChanges(formattedChanges);
		} else {
			addToQueue(dispatchChanges, [formattedChanges]);
		}
	}

	function unobserveValue() {
		if (typeof value === 'object' && value !== null) {
			Nested.unobserve(value, onValueChange);
		}
	}

	// Handle assignment that overwrites the whole value
	socket.on('replicantAssigned', data => {
		if (data.name !== name || data.bundle !== bundle) {
			return;
		}

		log.replicants('replicantAssigned', data);

		if (data.originatorId === self.id) {
			self.emit('assignmentAccepted', data);
		}

		assignValue(data.newValue, data.revision);
	});

	// Handle changes to individual properties of the value, if it is an object or array
	// If we're not at the correct revision, request a full update
	socket.on('replicantChanged', data => {
		if (self.status !== 'declared') {
			return;
		}

		if (data.name !== name || data.bundle !== bundle) {
			return;
		} else if (data.revision !== (self.revision + 1)) {
			log.replicants('[%s] Replicant "%s" not at head revision (ours %s, theirs %s), fetching latest...',
				bundle, name, self.revision, data.revision);
			fullUpdate();
			return;
		}

		log.replicants('replicantChanged', data);

		const oldValue = clone(value);
		const replayChanges = clone(data.changes);
		replayChanges.reverse();
		replayChanges.forEach(change => {
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

					const args = clone(change.removed);
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

		if (data.originatorId === self.id) {
			// Add a reference to the array being spliced.
			// This is required for other libs such as Polymer to make use of our change records.
			data.changes.forEach(change => {
				switch (change.type) {
					case 'splice':
						change.object = objectPath.get(value, change.path);
						break;
					default:
						// Do nothing.
				}
			});
		} else {
			unobserveValue();
			data.changes.forEach(change => {
				switch (change.type) {
					case 'add':
					case 'update':
						objectPath.set(value, change.path, change.newValue);
						break;
					case 'splice': {
						const arr = objectPath.get(value, change.path);
						const args = clone(change.added);
						args.unshift(change.removedCount);
						args.unshift(change.index);
						Array.prototype.splice.apply(arr, args);
						objectPath.set(value, change.path, arr);

						// Add a reference to the array being spliced.
						// This is required for other libs such as Polymer to make use of our change records.
						change.object = arr;
						break;
					}
					case 'delete':
						objectPath.del(value, change.path);
						break;
					default:
						// Do nothing.
				}
			});
			observeValue();
		}

		self.revision = data.revision;
		self.emit('change', oldValue, value, data.changes);
	});

	function fullUpdate() {
		window.NodeCG.readReplicant(name, bundle, data => {
			self.emit('fullUpdate', data);
			assignValue(data.value, data.revision);
		});
	}

	// If we lose connection, redeclare everything on reconnect
	socket.on('disconnect', () => {
		self.status = 'undeclared';
	});
	socket.on('reconnect', () => doBrowserDeclare(value));
}
