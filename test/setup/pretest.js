'use strict';

// Set up test bundle
var path = require('path');
var fs = require('fs');
var wrench = require('wrench');
var C = require('./test-constants');

// Create the cfg dir if it does not exist
if (!fs.existsSync(C.CFG_DIR)) {
    fs.mkdirSync(C.CFG_DIR);
}

wrench.copyDirSyncRecursive(C.TEST_BUNDLE_SRC_PATH, C.BUNDLE_DIR, { forceDelete: true });
fs.writeFileSync(C.BUNDLE_CFG_PATH, JSON.stringify({ test: 'the_test_string' }));

// Delete any existing persisted replicants for the test bundle
var replicantDir = path.resolve(__dirname, '../../db/replicants/test-bundle');
if (fs.existsSync(replicantDir)) {
    wrench.rmdirSyncRecursive(replicantDir);
}

