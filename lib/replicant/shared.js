/* eslint-disable camelcase */
'use strict';

const objectPath = require('object-path');
const proxyMap = new WeakMap();

const ARRAY_MUTATOR_METHODS = [
	'copyWithin',
	'fill',
	'pop',
	'push',
	'reverse',
	'shift',
	'sort',
	'splice',
	'unshift'
];

// TODO: add "delete" traps

const CHILD_ARRAY_HANDLER = {
	get(target, prop) {
		const metadata = proxyMap.get(target);
		if (metadata.replicant._ignoreProxy) {
			return target[prop];
		}

		if (ARRAY_MUTATOR_METHODS.indexOf(prop) >= 0) {
			return function () {
				metadata.replicant._addOperation(metadata.path, prop, Array.prototype.slice.call(arguments));
			};
		}

		return target[prop];
	},

	set(target, prop, newValue) {
		const metadata = proxyMap.get(target);
		const replicant = metadata.replicant;
		if (replicant._ignoreProxy) {
			target[prop] = newValue;
			return true;
		}

		if (target.hasOwnProperty(prop)) {
			replicant._addOperation(metadata.path, 'update', {prop, newValue});
		} else {
			replicant._addOperation(metadata.path, 'add', {prop, newValue});
		}

		return true;
	}
};

const CHILD_OBJECT_HANDLER = {
	get(target, prop) {
		return target[prop];
	},

	set(target, prop, newValue) {
		const metadata = proxyMap.get(target);
		const replicant = metadata.replicant;
		if (replicant._ignoreProxy) {
			target[prop] = newValue;
			return target[prop];
		}

		if (target.hasOwnProperty(prop)) {
			replicant._addOperation(metadata.path, 'update', {prop, newValue});
		} else {
			replicant._addOperation(metadata.path, 'add', {prop, newValue});
		}

		// TODO: this is probably bad.
		return true;
	}
};

module.exports = {
	ARRAY_MUTATOR_METHODS,

	/**
	 * Recursively Proxies an Array or Object. Does nothing to primitive values.
	 * @param replicant {object} - The Replicant in which to do the work.
	 * @param value {*} - The value to recursively Proxy.
	 * @param path {string} - The objectPath to this value.
	 * @returns {*} - The recursively Proxied value (or just `value` unchanged, if `value` is a primitive)
	 * @private
	 */
	_proxyRecursive(replicant, value, path) {
		if (typeof value === 'object') {
			if (proxyMap.has(value)) {
				return;
			}

			replicant.log.info('_proxyRecursive | value: %s, path: %s', value, path);
			proxyMap.set(value, {replicant, path});

			const handler = Array.isArray(value) ? CHILD_ARRAY_HANDLER : CHILD_OBJECT_HANDLER;
			const p = new Proxy(value, handler);
			for (const key in value) {
				if (!value.hasOwnProperty(key)) {
					continue;
				}

				const escapedKey = key.replace(/\//g, '~1');
				if (path) {
					const joinedPath = path.endsWith('/') ? `${path}${escapedKey}` : `${path}/${escapedKey}`;
					value[key] = this._proxyRecursive(replicant, value[key], joinedPath);
				} else {
					value[key] = this._proxyRecursive(replicant, value[key], escapedKey);
				}
			}
			return p;
		}

		return value;
	},

	/**
	 * If the operation is an array mutator method, call it on the target array with the operation arguments.
	 * Else, handle it with objectPath.
	 * @param replicant {object} - The Replicant to perform the operation on.
	 * @param operation {object} - The operation to perform.
	 */
	applyOperation(replicant, operation) {
		replicant._ignoreProxy = true;

		let path = operation.path.substr(1).split('/').map(part => {
			// De-tokenize '/' characters in path name
			return part.replace(/~1/g, '/');
		});

		// For some reason, empty paths in array formats cause errors.
		// To prevent this, we replace the path with an empty string if this is the case.
		if (path.length === 1 && path[0] === '') {
			path = [];
		}

		if (ARRAY_MUTATOR_METHODS.indexOf(operation.method) >= 0) {
			// TODO: items added via these methods aren't proxied
			/* eslint-disable prefer-spread */
			const arr = objectPath.get(replicant.value, path);
			arr[operation.method].apply(arr, operation.args);

			// Recursively check for any objects that may have been added by the above method
			// and that need to be Proxied.
			this._proxyRecursive(replicant, arr, operation.path);
			/* eslint-enable prefer-spread */
		} else {
			switch (operation.method) {
				case 'add':
				case 'update': {
					path.push(operation.args.prop);

					let newValue = operation.args.newValue;
					if (typeof newValue === 'object') {
						newValue = this._proxyRecursive(replicant, newValue, operation.path);
					}

					objectPath.set(replicant.value, path, newValue);
					break;
				}
				case 'delete':
					objectPath.del(replicant.value, path);
					break;
				default:
					throw new Error(`Unexpected operation method "${operation.method}"`);
			}
		}

		replicant._ignoreProxy = false;
	}
};
