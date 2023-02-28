(function () {
	'use strict';

	const { nodecg } = globalThis;
	const timestamp = Date.now();
	let { pathname } = globalThis.location;

	// If the pathname ends with /bundleName/ then we must be on index.html.
	if (pathname.endsWith(`/${nodecg.bundleName}/graphics/`)) {
		pathname += 'index.html';
	}

	/* istanbul ignore next: cant cover navigates page */
	globalThis.socket.on('graphic:kill', (instance) => {
		if (!instance) {
			return;
		}

		if (instance.socketId === globalThis.socket.id) {
			/* istanbul ignore next: cant cover navigates page */
			globalThis.location.href = '/instance/killed.html?pathname=' + pathname;
		}
	});

	/* istanbul ignore next: cant cover navigates page */
	globalThis.socket.on('graphic:refresh', (instance) => {
		if (!instance) {
			return;
		}

		if (instance.socketId === globalThis.socket.id) {
			/* istanbul ignore next: cant cover navigates page */
			globalThis.location.reload();
		}
	});

	/* istanbul ignore next: cant cover navigates page */
	globalThis.socket.on('graphic:refreshAll', (graphic) => {
		if (!graphic) {
			return;
		}

		if (graphic.url === pathname) {
			/* istanbul ignore next: cant cover navigates page */
			globalThis.location.reload();
		}
	});

	/* istanbul ignore next: cant cover navigates page */
	globalThis.socket.on('graphic:bundleRefresh', (bundleName) => {
		if (!bundleName) {
			return;
		}

		if (bundleName === nodecg.bundleName) {
			/* istanbul ignore next: cant cover navigates page */
			globalThis.location.reload();
		}
	});

	// On page load, register this socket with its URL pathname, so that the server can keep track of it.
	// In single-instance graphics, this registration will be rejected if the graphic is already open elsewhere.
	register();
	/* istanbul ignore next: hard to test reconnection stuff right now */
	globalThis.socket.io.on('reconnect', () => {
		register();
	});

	globalThis.socket.on('disconnect', (reason) => {
		if (reason === 'io server disconnect') {
			// The server forcibly closed the socket.
			// In this case, the client won't automatically reconnect.
			// So, we manually do it here:
			socket.connect();
		} else {
			console.log('Socket disconnect reason:', reason);
		}
	});

	function register(): void {
		globalThis.socket.emit(
			'graphic:registerSocket',
			{
				timestamp,
				pathName: pathname,
				bundleName: nodecg.bundleName,
				bundleVersion: nodecg.bundleVersion,
				bundleGit: nodecg.bundleGit,
			},
			(_error, accepted) => {
				/* istanbul ignore if: cant cover navigates page */
				if (accepted) {
					// This event and window boolean are ONLY used for tests.
					// Kinda gross, sorry.
					window.dispatchEvent(new CustomEvent('nodecg-registration-accepted'));
					(window as any).__nodecgRegistrationAccepted__ = true;
				} else {
					/* istanbul ignore next: cant cover navigates page */
					globalThis.location.href = '/instance/busy.html?pathname=' + pathname;
				}
			},
		);
	}
})();
