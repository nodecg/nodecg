'use strict';

var config = require(process.cwd() + '/lib/config').config;
var path = require('path');
var util = require('util');

var bundleName        = 'test-bundle';
var testBundleSrcPath = path.resolve(process.cwd(), 'test/setup/', bundleName);
var bundleDir         = path.resolve(process.cwd(), 'bundles', bundleName);
var cfgDir            = path.resolve(process.cwd(), 'cfg');
var bundleCfgPath     = path.resolve(cfgDir, bundleName + '.json');
var dashboardUrl      = util.format("http://%s:%d/", config.host, config.port);
var viewUrl           = dashboardUrl + 'view/' + bundleName;

module.exports = {
    BUNDLE_NAME: bundleName,
    TEST_BUNDLE_SRC_PATH: testBundleSrcPath,
    BUNDLE_DIR: bundleDir,
    CFG_DIR: cfgDir,
    BUNDLE_CFG_PATH: bundleCfgPath,
    DASHBOARD_URL: dashboardUrl,
    VIEW_URL: viewUrl
};


