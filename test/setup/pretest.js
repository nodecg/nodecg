'use strict';

// Set up test bundle
var path = require('path');
var fs = require('fs.extra');
var C = require('./test-constants');

// Create the cfg dir if it does not exist
if (!fs.existsSync(C.CFG_DIR)) {
	fs.mkdirSync(C.CFG_DIR);
}

fs.rmrf(C.BUNDLE_DIR, function (err) {
	if (err) {
		throw err;
	}

	fs.copyRecursive(C.TEST_BUNDLE_SRC_PATH, C.BUNDLE_DIR, function (err) {
		if (err) {
			throw err;
		}
	});
});

fs.writeFile(C.BUNDLE_CFG_PATH, JSON.stringify({test: 'the_test_string'}));

// Delete any existing persisted replicants for the test bundle
var replicantDir = path.resolve(__dirname, '../../db/replicants/test-bundle');
fs.rmrf(replicantDir, function (err) {
	if (err) {
		throw err;
	}
});
