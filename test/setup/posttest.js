'use strict';

// Remove test bundle
var fs = require('fs');
var wrench = require('wrench');
var C = require('./test-constants');

try {
	fs.unlinkSync(C.BUNDLE_CFG_PATH);
	wrench.rmdirSyncRecursive(C.BUNDLE_DIR);
} catch (e) {
	if (fs.existsSync(C.BUNDLE_DIR)) {
		try {
			fs.unlinkSync(C.BUNDLE_DIR);
		} catch (e) {
			console.warn('Couldn\'t clean up test bundle files');
		}
	}
}

