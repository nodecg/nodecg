// This file contains code that is used in both server-side and client-side replicants.
'use strict';

const validator = require('is-my-json-valid');
const clone = require('clone');
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

/**
 * The default persistence interval, in milliseconds.
 * @type {Number}
 */
const DEFAULT_PERSISTENCE_INTERVAL = 100;

const deleteTrap = function (target, prop) {
	const metadata = metadataMap.get(target);
	const {replicant} = metadata;

	if (replicant._ignoreProxy) {
		return delete target[prop];
	}

	// If the target doesn't have this prop, return true.
	if (!{}.hasOwnProperty.call(target, prop)) {
		return true;
	}

	if (replicant.schema) {
		const valueClone = clone(replicant.value);
		const targetClone = objectPath.get(valueClone, pathStrToPathArr(metadata.path));
		delete targetClone[prop];
		replicant.validate(valueClone);
	}

	replicant._addOperation(metadata.path, 'delete', {prop});
	if (!process.browser) {
		return delete target[prop];
	}
};

const CHILD_ARRAY_HANDLER = {
	get(target, prop) {
		const metadata = metadataMap.get(target);
		const {replicant} = metadata;
		if (metadata.replicant._ignoreProxy) {
			return target[prop];
		}

		if ({}.hasOwnProperty.call(Array.prototype, prop) && typeof Array.prototype[prop] === 'function' &&
			target[prop] === Array.prototype[prop] && ARRAY_MUTATOR_METHODS.indexOf(prop) >= 0) {
			/* eslint-disable prefer-spread */
			return (...args) => {
				if (replicant.schema) {
					const valueClone = clone(replicant.value);
					const targetClone = objectPath.get(valueClone, pathStrToPathArr(metadata.path));
					targetClone[prop].apply(targetClone, args);
					replicant.validate(valueClone);
				}

				if (process.browser) {
					metadata.replicant._addOperation(metadata.path, prop, Array.prototype.slice.call(args));
				} else {
					replicant._ignoreProxy = true;
					metadata.replicant._addOperation(metadata.path, prop, Array.prototype.slice.call(args));
					const retValue = target[prop].apply(target, args);
					replicant._ignoreProxy = false;

					// We have to re-proxy the target because the items could have been inserted.
					proxyRecursive(replicant, target, metadata.path);

					// TODO: This could leak a non-proxied object and cause bugs!
					return retValue;
				}
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
		const {replicant} = metadata;

		if (replicant._ignoreProxy) {
			target[prop] = newValue;
			return true;
		}

		if (replicant.schema) {
			const valueClone = clone(replicant.value);
			const targetClone = objectPath.get(valueClone, pathStrToPathArr(metadata.path));
			targetClone[prop] = newValue;
			replicant.validate(valueClone);
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
		const value = target[prop];

		const tag = Object.prototype.toString.call(value);
		const shouldBindProperty = (prop !== 'constructor') && (
			tag === '[object Function]' ||
			tag === '[object AsyncFunction]' ||
			tag === '[object GeneratorFunction]'
		);

		if (shouldBindProperty) {
			return value.bind(target);
		}

		return value;
	},

	set(target, prop, newValue) {
		if (target[prop] === newValue) {
			return true;
		}

		const metadata = metadataMap.get(target);
		const {replicant} = metadata;

		if (replicant._ignoreProxy) {
			target[prop] = newValue;
			return true;
		}

		if (replicant.schema) {
			const valueClone = clone(replicant.value);
			const targetClone = objectPath.get(valueClone, pathStrToPathArr(metadata.path));
			targetClone[prop] = newValue;
			replicant.validate(valueClone);
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
	DEFAULT_PERSISTENCE_INTERVAL,
	_proxyRecursive: proxyRecursive,

	/**
	 * If the operation is an array mutator method, call it on the target array with the operation arguments.
	 * Else, handle it with objectPath.
	 * @param replicant {object} - The Replicant to perform the operation on.
	 * @param operation {object} - The operation to perform.
	 */
	applyOperation(replicant, operation) {
		replicant._ignoreProxy = true;

		let result;
		const path = pathStrToPathArr(operation.path);
		if (ARRAY_MUTATOR_METHODS.indexOf(operation.method) >= 0) {
			/* eslint-disable prefer-spread */
			const arr = objectPath.get(replicant.value, path);
			result = arr[operation.method].apply(arr, operation.args);

			// Recursively check for any objects that may have been added by the above method
			// and that need to be Proxied.
			this._proxyRecursive(replicant, arr, operation.path);
			/* eslint-enable prefer-spread */
		} else {
			switch (operation.method) {
				case 'add':
				case 'update': {
					path.push(operation.args.prop);

					let {newValue} = operation.args;
					if (typeof newValue === 'object') {
						newValue = this._proxyRecursive(replicant, newValue, pathArrToPathStr(path));
					}

					result = objectPath.set(replicant.value, path, newValue);
					break;
				}

				case 'delete':
					// Workaround for https://github.com/mariocasciaro/object-path/issues/69
					if (path.length === 0 || objectPath.has(replicant.value, path)) {
						const target = objectPath.get(replicant.value, path);
						result = delete target[operation.args.prop];
					}

					break;
				/* istanbul ignore next */
				default:
					/* istanbul ignore next */
					throw new Error(`Unexpected operation method "${operation.method}"`);
			}
		}

		replicant._ignoreProxy = false;
		return result;
	},

	/**
	 * Generates a JSON Schema validator function from the `schema` property of the provided replicant.
	 * @param replicant {object} - The Replicant to perform the operation on.
	 * @returns {function} - The generated validator function.
	 */
	generateValidator(replicant) {
		const validate = validator(replicant.schema, {
			greedy: true,
			verbose: true
		});

		/**
		 * Validates a value against the current Replicant's schema.
		 * Throws when the value fails validation.
		 * @param [value=replicant.value] {*} - The value to validate. Defaults to the replicant's current value.
		 * @param [opts] {Object}
		 * @param [opts.throwOnInvalid = true] {Boolean} - Whether or not to immediately throw when the provided value fails validation against the schema.
		 */
		return function (value = replicant.value, {throwOnInvalid = true} = {}) {
			const result = validate(value);
			if (!result) {
				this.validationErrors = validate.errors;

				if (throwOnInvalid) {
					let errorMessage = `Invalid value rejected for replicant "${replicant.name}" in namespace "${replicant.namespace}":\n`;
					validate.errors.forEach(error => {
						const field = error.field.replace(/^data\./, '');
						if (error.message === 'is the wrong type') {
							errorMessage += `\tField "${field}" ${error.message}. Value "${error.value}" (type: ${typeof error.value}) was provided, expected type "${error.type}"\n `;
						} else if (error.message === 'has additional properties') {
							errorMessage += `\tField "${field}" ${error.message}: "${error.value}"\n`;
						} else {
							errorMessage += `\tField "${field}" ${error.message}\n`;
						}
					});
					throw new Error(errorMessage);
				}
			}

			return result;
		};
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

		assertSingleOwner(replicant, value);

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
			/* istanbul ignore if */
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

/**
 * Converts a string path (/a/b/c) to an array path ['a', 'b', 'c']
 * @param path {String} - The path to convert.
 * @returns {Array} - The converted path.
 */
function pathStrToPathArr(path) {
	path = path.substr(1).split('/').map(part => {
		// De-tokenize '/' characters in path name
		return part.replace(/~1/g, '/');
	});

	// For some reason, path arrays whose only item is an empty string cause errors.
	// In this case, we replace the path with an empty array, which seems to be fine.
	if (path.length === 1 && path[0] === '') {
		path = [];
	}

	return path;
}

/**
 * Converts an array path ['a', 'b', 'c'] to a string path /a/b/c)
 * @param path {Array} - The path to convert.
 * @returns {String} - The converted path.
 */
function pathArrToPathStr(path) {
	const strPath = path.join('/');
	if (strPath.charAt(0) !== '/') {
		return `/${strPath}`;
	}

	return strPath;
}

/**
 * Throws an exception if an object belongs to more than one Replicant.
 * @param replicant {object} - The Replicant that this value should belong to.
 * @param value {*} - The value to check ownership of.
 */
function assertSingleOwner(replicant, value) {
	let metadata;
	if (proxySet.has(value)) {
		metadata = proxyMetadataMap.get(value);
	} else if (metadataMap.has(value)) {
		metadata = metadataMap.get(value);
	} else {
		// If there's no metadata for this value, then it doesn't belong to any Replicants yet,
		// and we're okay to continue.
		return;
	}

	if (metadata.replicant !== replicant) {
		/* eslint-disable function-paren-newline */
		throw new Error(
			`This object belongs to another Replicant, ${metadata.replicant.namespace}::${metadata.replicant.name}.` +
			`\nA given object cannot belong to multiple Replicants. Object value:\n${JSON.stringify(value, null, 2)}`
		);
		/* eslint-enable function-paren-newline */
	}
}
