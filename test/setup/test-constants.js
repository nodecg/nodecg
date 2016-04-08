'use strict';

const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const config = require(path.join(rootDir, '/lib/config')).config;
const bundleName = 'test-bundle';
const cfgDir = path.join(rootDir, 'cfg');
const dashboardUrl = `http://${config.baseURL}`;

module.exports = {
	BUNDLE_NAME: bundleName,
	TEST_BUNDLE_SRC_PATH: path.join(rootDir, 'test/fixtures/bundles', bundleName),
	BUNDLE_DIR: path.join(rootDir, 'bundles', bundleName),
	CFG_DIR: cfgDir,
	BUNDLE_CFG_PATH: path.join(cfgDir, `${bundleName}.json`),
	DASHBOARD_URL: dashboardUrl,
	MIXER_URL: `${dashboardUrl}/#!/mixer`,
	TEST_PANEL_URL: `${dashboardUrl}/panel/${bundleName}/test`,
	PANEL_COMPONENTS_URL: `${dashboardUrl}/panel/${bundleName}/components`,
	GRAPHIC_URL: `${dashboardUrl}/graphics/${bundleName}`,
	SINGLE_INSTANCE_URL: `${dashboardUrl}/graphics/${bundleName}/single_instance.html`,
	CONFIG: config
};
