'use strict';

const replace = require('replace-in-file');

replace.sync({
	files: 'build/instrumented/**/*.js',
	from: /new Function\('return this'\)/g,
	to: "new Function('return window.top')",
});
