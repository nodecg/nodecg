/** Set up test bundle **/
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');

var BUNDLE_NAME = 'test-bundle';
var BUNDLE_DIR = path.resolve(process.cwd(), 'bundles', BUNDLE_NAME);
var CFG_PATH = path.resolve(process.cwd(), 'cfg', BUNDLE_NAME + '.json');
var TEST_BUNDLE_SRC_PATH = path.resolve(process.cwd(), 'test/setup/', BUNDLE_NAME);

wrench.copyDirSyncRecursive(TEST_BUNDLE_SRC_PATH, BUNDLE_DIR, {
    forceDelete: true
});
fs.writeFileSync(CFG_PATH, JSON.stringify({ test: "data" }));