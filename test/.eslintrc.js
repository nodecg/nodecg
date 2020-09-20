module.exports = {
	extends: ['plugin:ava/recommended'],
	plugins: ['ava'],
	env: {
		browser: true,
	},
	parserOptions: {
		project: './test/tsconfig.json',
	},
	rules: {
		'ava/no-import-test-files': ['error', { files: ['test/**/*.js'] }],
	},
};
