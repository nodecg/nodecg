module.exports = {
	files: ['test/**', '!test/helpers/**', '!test/fixtures/**', '!test/types/**'],
	concurrency: 1,
	timeout: '45s',
	verbose: true,
	environmentVariables: {
		test: 'true',
		NODECG_TEST: 'true',
		TS_NODE_PROJECT: 'test/tsconfig.json',
		TS_NODE_FILES: 'true',
	},
	extensions: ['ts'],
	require: ['@babel/register', 'ts-node/register'],
	workerThreads: false, // turning this on causes intermittent node.js crashes
};
