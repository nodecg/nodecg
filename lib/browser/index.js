'use strict';

const path = require('path');
const express = require('express');
const app = express();
const options = {root: path.join(__dirname, '/dist/')};

if (process.env.test) {
	app.get('/nodecg-api.js', (req, res) => {
		res.sendFile('browserifiedTestApi.js', options);
	});
} else {
	app.get('/nodecg-api.js', (req, res) => {
		res.sendFile('browserifiedApi.min.js', options);
	});

	app.get('/nodecg-api.map.json', (req, res) => {
		res.sendFile('browserifiedApi.map.json', options);
	});
}

app.use('/shims', express.static('./lib/browser/shims'));

module.exports = app;
