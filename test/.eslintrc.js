module.exports = {
	extends: ['plugin:ava/recommended'],
	plugins: ['ava'],
	env: {
		browser: true,
	},
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: __dirname,
	},
};
