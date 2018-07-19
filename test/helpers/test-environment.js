'use strict';

const path = require('path');
const server = require(path.resolve(__dirname, '../../lib/server'));

module.exports = {
	server,
	apis: {
		extension: {}
	},
	browser: {
		client: {},
		tabs: {}
	}
};
