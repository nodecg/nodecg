'use strict';

const pick = require('lodash.pick');

/**
 * Return the object properties, including the inherited ones.
 *
 * @param {object} object The object.
 * @return {Array<string>}
 */
module.exports = function (object) {
	if (typeof object.toJSON === 'undefined') {
		let propertyNames = [];
		let target = object;

		do {
			propertyNames = propertyNames.concat(Object.getOwnPropertyNames(target));
			target = Object.getPrototypeOf(target);
		} while (target);

		return pick(object, propertyNames);
	}

	return object;
};
