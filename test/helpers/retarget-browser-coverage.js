'use strict';

const replace = require('replace-in-file');

replace.sync({
	files: 'instrumented/**/*.js',
	from: /new Function\('return this'\)/g,
	to: 'new Function(\'return window.top\')'
});
