module.exports = {
	rules: {
		'no-bitwise': 0, // we have legitimate use cases for this
		'@typescript-eslint/ban-types': 0, // kind of don't have a choice when using TypeORM
	},
};
