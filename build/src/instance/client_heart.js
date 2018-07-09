/* eslint-env browser */
/* global nodecg */
(function () {
	'use strict';

	console.log('hm ok');

	let path = window.location.pathname;

	// If the pathname ends with /bundleName/ then we must be on index.html.
	if (_endsWith(path, nodecg.bundleName + '/')) {
		path += 'index.html';
	}

	// The dashboard will have some kind of killswitch to destroy all instances of a singleInstance graphic.
	// This includes the active instance *and* all "busy" pages waiting for that graphic to become available.
	window.socket.on('graphicKilled', killedPath => {
		if (killedPath === path) {
			window.location.href = '/instance/killed.html?path=' + path;
		}
	});

	// On page load, register this socket with its URL path, so that the server can keep track of it.
	// In single-instance graphics, this registration will be rejected if the graphic is already open elsewhere.
	window.socket.emit('graphic:registerSocket', path, accepted => {
		if (!accepted) {
			window.location.href = '/instance/busy.html?path=' + path;
		}
	});

	function _endsWith(string, suffix) {
		return string.indexOf(suffix, string.length - suffix.length) !== -1;
	}
})();
