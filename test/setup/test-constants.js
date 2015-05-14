'use strict';

var path = require('path');
var util = require('util');

var rootDir = path.resolve(__dirname, '../..');
var config = require(path.join(rootDir, '/lib/config')).getConfig();

var bundleName          = 'test-bundle';
var testBundleSrcPath   = path.resolve(rootDir, 'test/setup/', bundleName);
var bundleDir           = path.resolve(rootDir, 'bundles', bundleName);
var cfgDir              = path.resolve(rootDir, 'cfg');
var bundleCfgPath       = path.resolve(cfgDir, bundleName + '.json');
var dashboardUrl        = util.format('http://%s/dashboard/', config.baseURL);
var dashboardBundleUrl  = dashboardUrl + bundleName;
var displayUrl          = util.format('http://%s/display/', config.baseURL);
var displayBundleUrl    = displayUrl + bundleName;

module.exports = {
    BUNDLE_NAME: bundleName,
    TEST_BUNDLE_SRC_PATH: testBundleSrcPath,
    BUNDLE_DIR: bundleDir,
    CFG_DIR: cfgDir,
    BUNDLE_CFG_PATH: bundleCfgPath,
    DASHBOARD_URL: dashboardUrl,
    DASHBOARD_BUNDLE_URL: dashboardBundleUrl,
    DISPLAY_URL: displayUrl,
    DISPLAY_BUNDLE_URL: displayBundleUrl,
    CONFIG: config
};
