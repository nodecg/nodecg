'use strict';

var DEBOUNCE_DURATION = 500;
var timers = {};

module.exports = function (name, callback) {
	resetTimer(name, callback);
};

function resetTimer(name, callback) {
	clearTimeout(timers[name]);
	timers[name] = setTimeout(function () {
		delete timers.name;
		callback();
	}, DEBOUNCE_DURATION);
}
