'use strict';

// Set up test bundle
const path = require('path');
const fs = require('fs.extra');
const C = require('./test-constants');

// Create the cfg dir if it does not exist
if (!fs.existsSync(C.CFG_DIR)) {
	fs.mkdirSync(C.CFG_DIR);
}

// Write the test bundle config, overwriting one if it exists.
fs.writeFile(C.BUNDLE_CFG_PATH, JSON.stringify({test: 'the_test_string'}));

// Delete any existing persisted replicants for the test bundle
const replicantDir = path.resolve(__dirname, '../../db/replicants/test-bundle');
fs.rmrf(replicantDir, err => {
	if (err) {
		throw err;
	}
});

// Delete any existing assets for the test bundle
const assetsDir = path.resolve(__dirname, '../../assets/test-bundle');
fs.rmrf(assetsDir, err => {
	if (err) {
		throw err;
	}
});

// Delete bundles/test-bundle if it exists, then make a fresh copy of fixtures/bundles/test-bundle
fs.rmrf(C.BUNDLE_DIR, err => {
	if (err) {
		throw err;
	}

	fs.copyRecursive(C.TEST_BUNDLE_SRC_PATH, C.BUNDLE_DIR, err => {
		if (err) {
			throw err;
		}
	});

	fs.copyRecursive('test/fixtures/db', 'db', err => {
		if (err) {
			throw err;
		}
	});
});

// Enable extra debugging on TravisCI
if (process.env.TRAVIS_OS_NAME && process.env.TRAVIS_JOB_NUMBER) {
	fs.writeFileSync('cfg/nodecg.json', JSON.stringify({
		logging: {
			console: {
				enabled: true,
				level: 'debug'
			},
			replicants: true
		}
	}), 'utf-8');
}
