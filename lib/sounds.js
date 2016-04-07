/* eslint-disable no-new */
'use strict';

const clone = require('clone');
const fs = require('fs');
const path = require('path');
const app = require('express')();
const sha1File = require('sha1-file');
const bundles = require('./bundles');
const Replicant = require('./replicant');

// Create the replicant for the "Master Fader"
new Replicant('volume:master', '_sounds', {defaultValue: 100});

bundles.all().forEach(bundle => {
	// If this bundle has sounds
	if (bundle.soundCues.length > 0) {
		// Create an array replicant that will hold all this bundle's sound cues.
		new Replicant('soundCues', bundle.name, {
			defaultValue: bundle.soundCues.map(c => {
				const cue = clone(c);

				if (cue.defaultFile) {
					const filepath = path.join(bundle.dir, cue.defaultFile);
					const parsedPath = path.parse(filepath);
					cue.file = {
						sum: sha1File(filepath),
						base: parsedPath.base,
						ext: parsedPath.ext,
						name: parsedPath.name,
						url: `/sound/${bundle.name}/${cue.name}/default${parsedPath.ext}`,
						default: true
					};
					cue.defaultFile = cue.file;
				}

				if (cue.defaultVolume === undefined) {
					cue.volume = 30;
				} else {
					cue.volume = cue.defaultVolume;
				}

				return cue;
			}),
			persistent: false
		});

		// Create this bundle's "Bundle Fader"
		new Replicant(`volume:${bundle.name}`, '_sounds', {defaultValue: 100});
	}
});

app.get('/sound/:bundleName/:cueName/default.mp3', _serveDefault);
app.get('/sound/:bundleName/:cueName/default.ogg', _serveDefault);

function _serveDefault(req, res) {
	const bundle = bundles.find(req.params.bundleName);
	if (!bundle) {
		res.status(404).send(`File not found: ${req.path}`);
		return;
	}

	const cue = bundle.soundCues.find(cue => cue.name === req.params.cueName);
	if (!cue) {
		res.status(404).send(`File not found: ${req.path}`);
		return;
	}

	const fullPath = path.join(bundle.dir, cue.defaultFile);
	fs.exists(fullPath, exists => {
		if (!exists) {
			res.status(404).send(`File not found: ${req.path}`);
			return;
		}

		res.sendFile(fullPath);
	});
}

module.exports = app;
