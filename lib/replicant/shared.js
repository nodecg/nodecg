'use strict';

const objectPath = require('object-path');

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

const CHILD_ARRAY_HANDLER = {
	get(target, prop) {
		if (ARRAY_MUTATOR_METHODS.indexOf(prop) >= 0) {
			return function () {
				target.__ncg_replicant__._addOperation(target.__ncg_target_path__, prop, arguments);
			};
		}

		return target[prop];
	},

	set(target, prop, newValue) {
		if (target.hasOwnProperty(prop)) {
			target.__ncg_replicant__._addOperation(target.__ncg_target_path__, 'update', newValue);
		} else {
			target.__ncg_replicant__._addOperation(target.__ncg_target_path__, 'add', newValue);
		}
	}
};

const CHILD_OBJECT_HANDLER = {
	get(target, prop) {
		return target[prop];
	},

	set(target, prop, newValue) {
		if (target.hasOwnProperty(prop)) {
			target.__ncg_replicant__._addOperation(target.__ncg_target_path__, 'update', newValue);
		} else {
			target.__ncg_replicant__._addOperation(target.__ncg_target_path__, 'add', newValue);
		}
	}
};

module.exports = {
	ARRAY_MUTATOR_METHODS,

	/**
	 * Recursively Proxies an Array or Object. Does nothing to primitive values.
	 * @param value {*} - The value to recursively Proxy.
	 * @param path {string} - The objectPath to this value.
	 * @returns {*} - The recursively Proxied value (or just `value` unchanged, if `value` is a primitive)
	 * @private
	 */
	_proxyRecursive(value, path) {
		if (typeof value === 'object') {
			/* eslint-disable camelcase */
			Object.defineProperties({
				__ncg_replicant__: {
					enumerable: false,
					writable: false,
					value: this
				},
				__ncg_target_path__: {
					enumerable: false,
					writable: false,
					value: path
				}
			});
			/* eslint-enable camelcase */

			const handler = Array.isArray(value) ? CHILD_ARRAY_HANDLER : CHILD_OBJECT_HANDLER;
			const p = new Proxy(value, handler);
			for (const key in value) {
				if (!value.hasOwnProperty(key)) {
					continue;
				}

				value[key] = this._proxyRecursive(value[key], `${path}/${key.replace(/\//g, '~1')}`);
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
		if (ARRAY_MUTATOR_METHODS.indexOf(operation.method) >= 0) {
			const arr = objectPath.get(replicant.value, operation.path);
			arr[operation.method](...operation.args);
		} else {
			switch (operation.method) {
				case 'add':
				case 'update': {
					let newValue = operation.newValue;
					if (typeof operation.newValue === 'object') {
						newValue = this._proxyRecursive(newValue, operation.path);
					}

					objectPath.set(replicant.value, operation.path, newValue);
					break;
				}
				case 'delete':
					objectPath.del(replicant.value, operation.path);
					break;
				default:
					// Do nothing.
			}
		}
	}
};
