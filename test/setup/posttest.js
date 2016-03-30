'use strict';

// Remove test bundle
const fs = require('fs.extra');
const C = require('./test-constants');

try {
	fs.unlinkSync(C.BUNDLE_CFG_PATH);
	fs.rmrf(C.BUNDLE_DIR, err => {
		if (err) {
			throw err;
		}
	});
} catch (e) {
	if (fs.existsSync(C.BUNDLE_DIR)) {
		try {
			fs.unlinkSync(C.BUNDLE_DIR);
		} catch (e) {
			console.warn('Couldn\'t clean up test bundle files');
		}
	}
}

