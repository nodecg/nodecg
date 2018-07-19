'use strict';

const e = require('./test-environment');

module.exports = {
	sleep(milliseconds) {
		return new Promise(resolve => {
			setTimeout(() => {
				resolve();
			}, milliseconds);
		});
	},

	waitForRegistration: async () => {
		const response = await e.browser.client.executeAsync(done => {
			if (window.__nodecgRegistrationAccepted__) {
				finish();
			} else {
				window.addEventListener('nodecg-registration-accepted', finish);
			}

			function finish() {
				done(window.__refreshMarker__);
				window.__refreshMarker__ = '__refreshMarker__';
			}
		});
		return response && response.value;
	}
};
