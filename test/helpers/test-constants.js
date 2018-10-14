const path = require('path');

export const bundleName = () => 'test-bundle';

export const replicantsRoot = () => path.join(process.env.NODECG_ROOT, 'db/replicants');

export const assetsRoot = () => path.join(process.env.NODECG_ROOT, 'assets');

export const rootUrl = () => {
	const {NODECG_TEST_PORT} = process.env;
	if (!NODECG_TEST_PORT) {
		throw new Error('NODECG_TEST_PORT is missing. Is NodeCG initialized yet?');
	}
	return `http://localhost:${NODECG_TEST_PORT}/`;
};

export const loginUrl = () => {
	return `${rootUrl()}login/`;
};

export const dashboardUrl = () => {
	return `${rootUrl()}dashboard/`;
};

export const testBundleRoot = () => {
	return `${rootUrl()}bundles/${bundleName()}/`;
};

export const testPanelUrl = () => {
	return `${testBundleRoot()}dashboard/panel.html`;
};

export const bundleBowerComponentsUrl = () => {
	return `${testBundleRoot()}bower_components/`;
};

export const bundleNodeModulesUrl = () => {
	return `${testBundleRoot()}node_modules/`;
};

export const graphicUrl = () => {
	return `${testBundleRoot()}graphics/`;
};

export const singleInstanceUrl = () => {
	return `${testBundleRoot()}graphics/single_instance.html`;
};
