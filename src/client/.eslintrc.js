module.exports = {
	env: {
		node: false,
		browser: true,
	},
	globals: {
		NodeCG: true,
	},
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: __dirname,
	},
};
