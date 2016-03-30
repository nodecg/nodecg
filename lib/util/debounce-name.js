'use strict';

const DEFAULT_DURATION = 500;
const timers = {};

/**
 * A standard debounce, but uses a string `name` as the key instead of the callback.
 * @param name {string}
 * @param callback {function}
 * @param [duration=500] {number} - The number of milliseconds to debounce by.
 */
module.exports = function (name, callback, duration) {
	if (duration === undefined) {
		duration = DEFAULT_DURATION;
	}

	clearTimeout(timers[name]);
	timers[name] = setTimeout(() => {
		delete timers.name;
		callback();
	}, duration);
};
