import { createBrowserConfig, createServerConfig, createTypeORMConfig } from '.';

const environment = (process.env.NODE_ENV ?? 'development').trim();
const isProduction = environment === 'production';
const instrument = process.env.NODECG_INSTRUMENT?.toLowerCase() === 'true';

console.log('Build mode:', isProduction ? 'production' : 'development');

if (instrument) {
	console.info('Creating instrumented build for code coverage.');
}

export default [
	createServerConfig({ isProduction, instrument }),
	createBrowserConfig({ isProduction, instrument }),
	createTypeORMConfig({ isProduction }),
];
