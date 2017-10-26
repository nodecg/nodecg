'use strict';

const express = require('express');
const app = express();
const path = require('path');
const log = require('./logger')('nodecg/lib/mounts');
const Bundles = require('./bundle-manager');

log.trace('Adding Express routes for user-defined bundle mountpoints');

const all = Bundles.all();

all.forEach(bundle => {
	bundle.mount.forEach(mount => {
		app.get(`/bundles/${bundle.name}/${mount.endpoint}/*`, (req, res, next) => {
			const resName = req.params[0];
			const fileLocation = path.join(bundle.dir, mount.directory, resName);

			res.sendFile(fileLocation, err => {
				if (err) {
					if (err.code === 'ENOENT') {
						return res.sendStatus(404);
					}

					return next();
				}
			});
		});
		log.trace(`Mounted ${mount.directory} at ${mount.endpoint}/ for ${bundle.name}`);
	});
});

module.exports = app;
