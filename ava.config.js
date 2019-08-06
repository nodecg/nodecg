export default {
	files: [
		'test/**'
	],
	helpers: [
		'test/fixtures/**',
		'test/helpers/**'
	],
	concurrency: 1,
	timeout: '2m',
	verbose: true
};
