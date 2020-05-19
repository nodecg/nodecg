// Native
import path from 'path';

export const bundleName = (): string => 'test-bundle';

export const replicantsRoot = (): string => path.join(process.env.NODECG_ROOT, 'db/replicants');

export const assetsRoot = (): string => path.join(process.env.NODECG_ROOT, 'assets');

export const rootUrl = (): string => {
	const { NODECG_TEST_PORT } = process.env;
	if (!NODECG_TEST_PORT) {
		throw new Error('NODECG_TEST_PORT is missing. Is NodeCG initialized yet?');
	}

	return `http://localhost:${NODECG_TEST_PORT}/`;
};

export const loginUrl = (): string => {
	return `${rootUrl()}login/`;
};

export const dashboardUrl = (): string => {
	return `${rootUrl()}dashboard/`;
};

export const testBundleRoot = (): string => {
	return `${rootUrl()}bundles/${bundleName()}/`;
};

export const testPanelUrl = (): string => {
	return `${testBundleRoot()}dashboard/panel.html`;
};

export const bundleBowerComponentsUrl = (): string => {
	return `${testBundleRoot()}bower_components/`;
};

export const bundleNodeModulesUrl = (): string => {
	return `${testBundleRoot()}node_modules/`;
};

export const graphicUrl = (): string => {
	return `${testBundleRoot()}graphics/`;
};

export const singleInstanceUrl = (): string => {
	return `${testBundleRoot()}graphics/single_instance.html`;
};
