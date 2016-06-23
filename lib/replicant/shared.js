'use strict';

const objectPath = require('object-path');
const proxyMetadataMap = new WeakMap();
const metadataMap = new WeakMap();
const proxySet = new WeakSet();

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

const deleteTrap = function (target, prop) {
	const metadata = metadataMap.get(target);
	if (metadata.replicant._ignoreProxy) {
		return delete target[prop];
	}

	metadata.replicant._addOperation(metadata.path, 'delete', {prop});
	if (!process.browser) {
		return delete target[prop];
	}
};

const CHILD_ARRAY_HANDLER = {
	get(target, prop) {
		const metadata = metadataMap.get(target);
		const replicant = metadata.replicant;
		if (metadata.replicant._ignoreProxy) {
			return target[prop];
		}

		if (ARRAY_MUTATOR_METHODS.indexOf(prop) >= 0) {
			if (process.browser) {
				return function () {
					metadata.replicant._addOperation(metadata.path, prop, Array.prototype.slice.call(arguments));
				};
			}

			/* eslint-disable prefer-spread */
			return function () {
				replicant._ignoreProxy = true;
				metadata.replicant._addOperation(metadata.path, prop, Array.prototype.slice.call(arguments));
				const retValue = target[prop].apply(target, arguments);
				replicant._ignoreProxy = false;

				// We have to re-proxy the target because the items could have been inserted.
				proxyRecursive(replicant, target, metadata.path);

				// TODO: This could leak a non-proxied object and cause bugs!
				return retValue;
			};
			/* eslint-enable prefer-spread */
		}

		return target[prop];
	},

	set(target, prop, newValue) {
		if (target[prop] === newValue) {
			return true;
		}

		const metadata = metadataMap.get(target);
		const replicant = metadata.replicant;

		if (replicant._ignoreProxy) {
			target[prop] = newValue;
			return true;
		}

		// It is crucial that this happen *before* the assignment below.
		if ({}.hasOwnProperty.call(target, prop)) {
			replicant._addOperation(metadata.path, 'update', {
				prop,
				newValue
			});
		} else {
			replicant._addOperation(metadata.path, 'add', {
				prop,
				newValue
			});
		}

		// If this Replicant is running in the server context, immediately apply the value.
		if (!process.browser) {
			target[prop] = proxyRecursive(metadata.replicant, newValue, joinPathParts(metadata.path, prop));
		}

		return true;
	},

	deleteProperty: deleteTrap
};

const CHILD_OBJECT_HANDLER = {
	get(target, prop) {
		return target[prop];
	},

	set(target, prop, newValue) {
		if (target[prop] === newValue) {
			return true;
		}

		const metadata = metadataMap.get(target);
		const replicant = metadata.replicant;

		if (replicant._ignoreProxy) {
			target[prop] = newValue;
			return true;
		}

		// It is crucial that this happen *before* the assignment below.
		if ({}.hasOwnProperty.call(target, prop)) {
			replicant._addOperation(metadata.path, 'update', {
				prop,
				newValue
			});
		} else {
			replicant._addOperation(metadata.path, 'add', {
				prop,
				newValue
			});
		}

		// If this Replicant is running in the server context, immediately apply the value.
		if (!process.browser) {
			target[prop] = proxyRecursive(metadata.replicant, newValue, joinPathParts(metadata.path, prop));
		}

		return true;
	},

	deleteProperty: deleteTrap
};

module.exports = {
	ARRAY_MUTATOR_METHODS,
	_proxyRecursive: proxyRecursive,

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
					// Workaround for https://github.com/mariocasciaro/object-path/issues/69
					if (path.length === 0 || objectPath.has(replicant.value, path)) {
						const target = objectPath.get(replicant.value, path);
						delete target[operation.args.prop];
					}
					break;
				default:
					throw new Error(`Unexpected operation method "${operation.method}"`);
			}
		}

		replicant._ignoreProxy = false;
	}
};

/**
 * Recursively Proxies an Array or Object. Does nothing to primitive values.
 * @param replicant {object} - The Replicant in which to do the work.
 * @param value {*} - The value to recursively Proxy.
 * @param path {string} - The objectPath to this value.
 * @returns {*} - The recursively Proxied value (or just `value` unchanged, if `value` is a primitive)
 * @private
 */
function proxyRecursive(replicant, value, path) {
	if (typeof value === 'object' && value !== null) {
		let p;

		// If "value" is already a Proxy, don't re-proxy it.
		if (proxySet.has(value)) {
			p = value;
			const metadata = proxyMetadataMap.get(value);
			metadata.path = path; // Update the path, as it may have changed.
		} else if (metadataMap.has(value)) {
			const metadata = metadataMap.get(value);
			p = metadata.proxy;
			metadata.path = path; // Update the path, as it may have changed.
		} else {
			const handler = Array.isArray(value) ? CHILD_ARRAY_HANDLER : CHILD_OBJECT_HANDLER;
			p = new Proxy(value, handler);
			proxySet.add(p);
			const metadata = {
				replicant,
				path,
				proxy: p
			};
			metadataMap.set(value, metadata);
			proxyMetadataMap.set(p, metadata);
		}

		for (const key in value) {
			if (!{}.hasOwnProperty.call(value, key)) {
				continue;
			}

			const escapedKey = key.replace(/\//g, '~1');
			if (path) {
				const joinedPath = joinPathParts(path, escapedKey);
				value[key] = proxyRecursive(replicant, value[key], joinedPath);
			} else {
				value[key] = proxyRecursive(replicant, value[key], escapedKey);
			}
		}
		return p;
	}

	return value;
}

function joinPathParts(part1, part2) {
	return part1.endsWith('/') ? `${part1}${part2}` : `${part1}/${part2}`;
}
