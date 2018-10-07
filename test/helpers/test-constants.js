const path = require('path');

export const BUNDLE_NAME = 'test-bundle';

export const REPLICANTS_ROOT = path.join(process.env.NODECG_ROOT, 'db/replicants');

export const ASSETS_ROOT = path.join(process.env.NODECG_ROOT, 'assets');

export function rootUrl() {
	return `http://localhost:${process.env.NODECG_TEST_PORT}/`;
}

export function loginUrl() {
	return `${rootUrl()}login/`;
}

export function dashboardUrl() {
	return `${rootUrl()}dashboard/`;
}

function testBundleRoot() {
	return `${rootUrl()}bundles/${BUNDLE_NAME}/`;
}

export function testPanelUrl() {
	return `${testBundleRoot()}dashboard/panel.html`
}

export function bundleBowerComponentsUrl() {
	return `${testBundleRoot()}bower_components/`;
}

export function bundleNodeModulesUrl() {
	return `${testBundleRoot()}node_modules/`;
}

export function graphicUrl() {
	return `${testBundleRoot()}graphics/`;
}

export function singleInstanceUrl() {
	return `${testBundleRoot()}graphics/single_instance.html`;
}
