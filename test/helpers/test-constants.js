'use strict';

const path = require('path');
const config = require(path.resolve(__dirname, '../../lib/config')).config;
const bundleName = 'test-bundle';

function rootUrl() {
	return `http://localhost:${process.env.NODECG_TEST_PORT}/`;
}

function loginUrl() {
	return `${rootUrl()}login/`;
}

function dashboardUrl() {
	return `${rootUrl()}dashboard/`;
}

function testBundleRoot() {
	return `${rootUrl()}bundles/${bundleName}/`;
}

module.exports = {
	BUNDLE_NAME: bundleName,
	CONFIG: config,
	REPLICANTS_ROOT: path.join(process.env.NODECG_ROOT, 'db/replicants'),
	ASSETS_ROOT: path.join(process.env.NODECG_ROOT, 'assets'),

	get ROOT_URL() {
		return rootUrl();
	},

	get LOGIN_URL() {
		return loginUrl();
	},

	get DASHBOARD_URL() {
		return dashboardUrl();
	},

	get TEST_PANEL_URL() {
		return `${testBundleRoot()}dashboard/panel.html`;
	},

	get BUNDLE_BOWER_COMPONENTS_URL() {
		return `${testBundleRoot()}bower_components/`;
	},

	get BUNDLE_NODE_MODULES_URL() {
		return `${testBundleRoot()}node_modules/`;
	},

	get GRAPHIC_URL() {
		return `${testBundleRoot()}graphics/`;
	},

	get SINGLE_INSTANCE_URL() {
		return `${testBundleRoot()}graphics/single_instance.html`;
	}
};
