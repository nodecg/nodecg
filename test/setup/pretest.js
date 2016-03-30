'use strict';

// Set up test bundle
const path = require('path');
const fs = require('fs.extra');
const C = require('./test-constants');

// Create the cfg dir if it does not exist
if (!fs.existsSync(C.CFG_DIR)) {
	fs.mkdirSync(C.CFG_DIR);
}

fs.rmrf(C.BUNDLE_DIR, err => {
	if (err) {
		throw err;
	}

	fs.copyRecursive(C.TEST_BUNDLE_SRC_PATH, C.BUNDLE_DIR, err => {
		if (err) {
			throw err;
		}
	});
});

fs.writeFile(C.BUNDLE_CFG_PATH, JSON.stringify({test: 'the_test_string'}));

// Delete any existing persisted replicants for the test bundle
const replicantDir = path.resolve(__dirname, '../../db/replicants/test-bundle');
fs.rmrf(replicantDir, err => {
	if (err) {
		throw err;
	}
});
