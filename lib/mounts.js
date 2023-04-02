'use strict';

const express = require('express');
const app = express();
const path = require('path');
const log = require('./logger')('nodecg/lib/mounts');
const Bundles = require('./bundle-manager');
const ncgUtils = require('./util');

log.trace('Adding Express routes for user-defined bundle mountpoints');

const all = Bundles.all();

all.forEach(bundle => {
	bundle.mount.forEach(mount => {
		app.get(`/bundles/${bundle.name}/${mount.endpoint}/*`, ncgUtils.authCheck, (req, res, next) => {
			const resName = req.params[0];
			const parentDir = path.join(bundle.dir, mount.directory);
			const fullPath = path.join(parentDir, resName);
			ncgUtils.sendFile(parentDir, fullPath, res, next);
		});
		log.trace(`Mounted ${mount.directory} at ${mount.endpoint}/ for ${bundle.name}`);
	});
});

module.exports = app;
