/* eslint-env browser */
/* global nodecg */
(function () {
	'use strict';

	var path = window.location.pathname;

	// If the pathname ends with /bundleName/ then we must be on index.html.
	if (_endsWith(path, nodecg.bundleName + '/')) {
		path += 'index.html';
	}

	// The dashboard will have some kind of killswitch to destroy all instances of a singleInstance graphic.
	// This includes the active instance *and* all "busy" pages waiting for that graphic to become available.
	window.socket.on('graphicKilled', function (killedPath) {
		console.log('graphicKilled', killedPath);
		if (killedPath === path) {
			window.location.href = '/instance/killed.html?path=' + path;
		}
	});

	/* Send a heartbeat every 1000ms. If our heartbeat is rejected, replace the omnibar with a small red rectangle
	 * to indicate to the operator that the page must be reloaded. */
	setInterval(_emitHeartbeat, 1000);
	_emitHeartbeat();
	function _emitHeartbeat() {
		window.socket.emit('graphicHeartbeat', path, function (accepted) {
			// If our heartbeat wasn't accepted, go to the "busy" page
			if (!accepted) {
				window.location.href = '/instance/busy.html?path=' + path;
			}
		});
	}

	function _endsWith(string, suffix) {
		return string.indexOf(suffix, string.length - suffix.length) !== -1;
	}
})();
