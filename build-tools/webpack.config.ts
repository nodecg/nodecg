import { createBrowserConfig, createServerConfig, createTypeORMConfig } from '.';

module.exports = (env: any) => {
	if (!env) env = {};

	const environment = (process.env['NODE_ENV'] ?? 'development').trim();
	const isProduction = environment === 'production';
	const instrument = process.env['NODECG_INSTRUMENT']?.toLowerCase() === 'true';

	console.log('Build mode:', isProduction ? 'production' : 'development');

	if (instrument) {
		console.info('Creating instrumented build for code coverage.');
	}

	const configsToUse = [];

	if (!env.skipServer) {
		console.log('Adding Server config to build config');
		configsToUse.push(createServerConfig({ isProduction, instrument }));
	}

	if (!env.skipBrowser) {
		console.log('Adding Browser config to build config');
		configsToUse.push(createBrowserConfig({ isProduction, instrument }));
	}

	if (!env.skipTypeORM) {
		console.log('Adding TypeORM config to build config');
		configsToUse.push(createTypeORMConfig({ isProduction }));
	}

	return configsToUse;
};
