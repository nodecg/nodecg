'use strict';

const path = require('path');
const util = require('util');

const rootDir = path.resolve(__dirname, '../..');
const config = require(path.join(rootDir, '/lib/config')).config;

const bundleName = 'test-bundle';
const panelName = 'test';
const testBundleSrcPath = path.resolve(rootDir, 'test/setup/', bundleName);
const bundleDir = path.resolve(rootDir, 'bundles', bundleName);
const cfgDir = path.resolve(rootDir, 'cfg');
const bundleCfgPath = path.resolve(cfgDir, `${bundleName}.json`);
const dashboardUrl = util.format('http://%s/', config.baseURL);
const testPanelUrl = `${dashboardUrl}panel/${bundleName}/${panelName}`;
const panelComponentsUrl = `${dashboardUrl}panel/${bundleName}/components`;
const graphicUrl = `${dashboardUrl}graphics/${bundleName}`;
const singleInstanceUrl = `${dashboardUrl}graphics/${bundleName}/single_instance.html`;

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
