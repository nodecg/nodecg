/* istanbul ignore next */
'use strict';

const express = require('express');

module.exports = function (nodecg) {
	const app = express();
	app.get('/test-bundle/test-route', (req, res) => {
		res.sendStatus(200);
	});

	nodecg.mount(app);

	return nodecg;
};
