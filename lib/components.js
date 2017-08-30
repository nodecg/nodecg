'use strict';

const express = require('express');
const app = express();
const path = require('path');
const log = require('./logger')('nodecg/lib/components');
const Bundles = require('./bundle-manager');

log.trace('Adding Express routes for bundle components');

const all = Bundles.all();

for (let i = 0; i < all.length; i++) {
	const bundle = all[i];
	if (bundle.mount) {
		for (let j = 0; j < bundle.mount.length; j++) {
			const mountdir = bundle.mount[j];
			if (typeof mountdir.endpoint !== "string" || typeof mountdir.directory !== "string") {
				log.warn('Skipping over mountpoint that is missing either a valid `endpoint` or `directory` property.');
				continue;
			}

			app.get(`/bundles/${bundle.name}/${mountdir.endpoint}/*`, (req, res, next) => {
				const resName = req.params[0];
				const fileLocation = path.join(bundle.dir, mountdir.directory, resName);

				res.sendFile(fileLocation, err => {
					if (err) {
						if (err.code === 'ENOENT') {
							return res.sendStatus(404);
						}

						return next();
					}
				});
			});
			log.trace(`Mounted ${mountdir.directory} at ${mountdir.endpoint}/`);
		}
	}
}

module.exports = app;
