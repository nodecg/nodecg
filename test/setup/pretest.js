'use strict';

// Set up test bundle
var fs = require('fs');
var wrench = require('wrench');
var C = require('./test-constants');

// Create the cfg dir if it does not exist
if (!fs.existsSync(C.CFG_DIR)) {
    console.log(C.CFG_DIR);
    fs.mkdirSync(C.CFG_DIR);
}

wrench.copyDirSyncRecursive(C.TEST_BUNDLE_SRC_PATH, C.BUNDLE_DIR, {
    forceDelete: true
});
fs.writeFileSync(C.BUNDLE_CFG_PATH, JSON.stringify({ test: "the_test_string" }));