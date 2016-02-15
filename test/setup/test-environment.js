'use strict';

var path = require('path');
var server = require(path.resolve(__dirname, '../../lib/server'));

module.exports = {
	server: server,
	apis: {
		extension: {}
	},
	browser: {
		client: {},
		tabs: {}
	}
};
