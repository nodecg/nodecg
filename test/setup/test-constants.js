'use strict';

var path = require('path');
var util = require('util');

var rootDir = path.resolve(__dirname, '../..');
var config = require(path.join(rootDir, '/lib/config')).config;

var bundleName = 'test-bundle';
var panelName = 'test';
var testBundleSrcPath = path.resolve(rootDir, 'test/setup/', bundleName);
var bundleDir = path.resolve(rootDir, 'bundles', bundleName);
var cfgDir = path.resolve(rootDir, 'cfg');
var bundleCfgPath = path.resolve(cfgDir, bundleName + '.json');
var dashboardUrl = util.format('http://%s/', config.baseURL);
var testPanelUrl = dashboardUrl + 'panel/' + bundleName + '/' + panelName;
var panelComponentsUrl = dashboardUrl + 'panel/' + bundleName + '/components';
var graphicUrl = dashboardUrl + 'graphics/' + bundleName;
var singleInstanceUrl = dashboardUrl + 'graphics/' + bundleName + '/single_instance.html';

module.exports = {
	BUNDLE_NAME: bundleName,
	TEST_BUNDLE_SRC_PATH: testBundleSrcPath,
	BUNDLE_DIR: bundleDir,
	CFG_DIR: cfgDir,
	BUNDLE_CFG_PATH: bundleCfgPath,
	DASHBOARD_URL: dashboardUrl,
	TEST_PANEL_URL: testPanelUrl,
	PANEL_COMPONENTS_URL: panelComponentsUrl,
	GRAPHIC_URL: graphicUrl,
	SINGLE_INSTANCE_URL: singleInstanceUrl,
	CONFIG: config
};
