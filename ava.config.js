export default {
	files: ['test/**'],
	helpers: ['test/fixtures/**', 'test/helpers/**', 'test/types/**'],
	concurrency: 1,
	timeout: '30s',
	verbose: true,
	environmentVariables: {
		test: 'true',
		NODECG_TEST: 'true',
		TS_NODE_PROJECT: 'test/tsconfig.json',
		TS_NODE_FILES: 'true',
	},
	compileEnhancements: false,
	extensions: ['ts'],
	require: ['ts-node/register'],
};
