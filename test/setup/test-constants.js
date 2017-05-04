'use strict';

const path = require('path');
const config = require(path.resolve(__dirname, '../../lib/config')).config;
const bundleName = 'test-bundle';
const dashboardUrl = `http://${config.baseURL}`;
const TEST_BUNDLE_ROOT = `${dashboardUrl}/bundles/${bundleName}`;

module.exports = {
	BUNDLE_NAME: bundleName,
	DASHBOARD_URL: dashboardUrl,
	TEST_PANEL_URL: `${TEST_BUNDLE_ROOT}/dashboard/panel.html`,
	BUNDLE_BOWER_COMPONENTS_URL: `${TEST_BUNDLE_ROOT}/bower_components`,
	GRAPHIC_URL: `${TEST_BUNDLE_ROOT}/graphics`,
	SINGLE_INSTANCE_URL: `${TEST_BUNDLE_ROOT}/graphics/single_instance.html`,
	CONFIG: config,
	REPLICANTS_ROOT: path.join(process.env.NODECG_ROOT, 'db/replicants'),
	ASSETS_ROOT: path.join(process.env.NODECG_ROOT, 'assets')
};
