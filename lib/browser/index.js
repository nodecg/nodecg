'use strict';

const path = require('path');
const express = require('express');
const app = express();
const options = {root: path.join(__dirname, '/dist/')};

app.get('/nodecg-api.js', (req, res) => {
	res.sendFile('browserifiedApi.min.js', options);
});

app.get('/nodecg-api.map.json', (req, res) => {
	res.sendFile('browserifiedApi.map.json', options);
});

app.get('/rollbar.min.js', (req, res) => {
	res.sendFile('rollbar.min.js', options);
});

module.exports = app;
