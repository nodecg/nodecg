'use strict';

const replace = require('replace-in-file');

replace.sync({
	files: 'dist/**/*.js',
	from: /new Function\('return this'\)/g,
	to: "new Function('return window.top')",
});
