'use strict';

const path = require('path');
const config = require(path.resolve(__dirname, '../../lib/config')).config;
const bundleName = 'test-bundle';
const dashboardUrl = `http://${config.baseURL}`;

module.exports = {
	BUNDLE_NAME: bundleName,
	DASHBOARD_URL: dashboardUrl,
	TEST_PANEL_URL: `${dashboardUrl}/panel/${bundleName}/panel.html`,
	PANEL_COMPONENTS_URL: `${dashboardUrl}/panel/${bundleName}/components`,
	GRAPHIC_URL: `${dashboardUrl}/graphics/${bundleName}`,
	SINGLE_INSTANCE_URL: `${dashboardUrl}/graphics/${bundleName}/single_instance.html`,
	CONFIG: config,
	REPLICANTS_ROOT: path.join(process.env.NODECG_ROOT, 'db/replicants'),
	ASSETS_ROOT: path.join(process.env.NODECG_ROOT, 'assets')
};
