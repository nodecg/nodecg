'use strict';

/**
 * Fromats JSON parsing erros into a readable string
 * @param {array} errors - AJV parsing errors
 * @returns {string}
 */

module.exports = function (errors) {
	if (!errors) {
		return '';
	}

	const err = [];
	errors.forEach(e => {
		err.push(`${e.instancePath} ${e.message}`);
	});
	return err.join('\n');
};
