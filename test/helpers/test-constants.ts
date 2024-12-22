// Native
import path from "path";

export const bundleName = (): string => "test-bundle";

export const replicantsRoot = (): string =>
	path.join(process.env.NODECG_ROOT, "db/replicants");

export const assetsRoot = (): string =>
	path.join(process.env.NODECG_ROOT, "assets");

export const rootUrl = (): string => {
	const { NODECG_TEST_PORT } = process.env;
	if (!NODECG_TEST_PORT) {
		throw new Error("NODECG_TEST_PORT is missing. Is NodeCG initialized yet?");
	}

	// https://github.com/node-fetch/node-fetch/issues/1624
	// https://github.com/nodejs/node/issues/40702
	return `http://127.0.0.1:${NODECG_TEST_PORT}/`;
};

export const loginUrl = (): string => `${rootUrl()}login/`;

export const dashboardUrl = (): string => `${rootUrl()}dashboard/`;

export const testBundleRoot = (): string =>
	`${rootUrl()}bundles/${bundleName()}/`;

export const testPanelUrl = (): string =>
	`${testBundleRoot()}dashboard/panel.html`;

export const bundleBowerComponentsUrl = (): string =>
	`${testBundleRoot()}bower_components/`;

export const bundleNodeModulesUrl = (): string =>
	`${testBundleRoot()}node_modules/`;

export const graphicUrl = (): string => `${testBundleRoot()}graphics/`;

export const singleInstanceUrl = (): string =>
	`${testBundleRoot()}graphics/single_instance.html`;
