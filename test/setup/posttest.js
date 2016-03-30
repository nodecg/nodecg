'use strict';

// Remove test bundle
var fs = require('fs.extra');
var C = require('./test-constants');

try {
	fs.unlinkSync(C.BUNDLE_CFG_PATH);
	fs.rmrf(C.BUNDLE_DIR, function (err) {
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

