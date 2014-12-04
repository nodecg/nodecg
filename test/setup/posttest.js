/** Remove test bundle **/
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');

var BUNDLE_NAME = 'test-bundle';
var BUNDLE_DIR = path.resolve(process.cwd(), 'bundles', BUNDLE_NAME);
var CFG_PATH = path.resolve(process.cwd(), 'cfg', BUNDLE_NAME + '.json');

try {
    fs.unlinkSync(CFG_PATH);
    wrench.rmdirSyncRecursive(BUNDLE_DIR);
} catch (e) {
    if (fs.existsSync(BUNDLE_DIR)) {
        try {
            fs.unlinkSync(BUNDLE_DIR);
        } catch (e) {
            console.warn("Couldn't clean up test bundle files")
        }
    } else {
        console.warn("Couldn't clean up test bundle files")
    }
}

