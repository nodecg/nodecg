/* eslint-disable no-new */
'use strict';

const clone = require('clone');
const fs = require('fs');
const path = require('path');
const app = require('express')();
const sha1File = require('sha1-file');
const bundles = require('./bundles');
const Replicant = require('./replicant');
const NodeCG = require('./api');
const log = require('./logger')('sounds');
const nodecg = new NodeCG({name: '_sounds'});
const cueRepsByBundle = new Map();
const customCueRepsByBundle = new Map();

// Create the replicant for the "Master Fader"
new Replicant('volume:master', '_sounds', {defaultValue: 100});

bundles.all().forEach(bundle => {
	// If this bundle has sounds
	if (bundle.soundCues.length > 0) {
		// Create an array replicant that will hold all this bundle's sound cues.
		const defaultCuesRepValue = _makeCuesRepDefaultValue(bundle);

		const cuesRep = new Replicant('soundCues', bundle.name, {
			schemaPath: 'schemas/soundCues.json',
			defaultValue: []
		});

		cueRepsByBundle.set(bundle.name, cuesRep);

		if (cuesRep.value.length > 0) {
			// Remove any persisted cues that are no longer in the bundle manifest.
			cuesRep.value = cuesRep.value.filter(persistedCue => {
				return defaultCuesRepValue.find(defaultCue => {
					return defaultCue.name === persistedCue.name;
				});
			});

			// Add/update any cues in the bundle manifest that aren't in the persisted replicant.
			defaultCuesRepValue.forEach(defaultCue => {
				const existingIndex = cuesRep.value.findIndex(persistedCue => {
					return persistedCue.name === defaultCue.name;
				});

				// We need to just update a few key properties in the persisted cue.
				// We leave things like volume as-is.
				if (existingIndex >= 0) {
					cuesRep.value[existingIndex].assignable = defaultCue.assignable;
					cuesRep.value[existingIndex].defaultFile = defaultCue.defaultFile;

					// If we're updating the cue to not be assignable, then we have to
					// set the `defaultFile` as the selected `file`.
					if (!defaultCue.assignable) {
						cuesRep.value[existingIndex].file = clone(defaultCue.defaultFile);
					}
				} else {
					cuesRep.value.push(defaultCue);
				}
			});
		} else {
			// There's no persisted value, so just assign the default.
			cuesRep.value = defaultCuesRepValue;
		}

		// Create this bundle's "Bundle Fader"
		new Replicant(`volume:${bundle.name}`, '_sounds', {defaultValue: 100});
	}

	if (bundle.enableCustomCues) {
		const customCuesRep = new Replicant('customSoundCues', bundle.name, {
			schemaPath: 'schemas/customSoundCues.json',
			defaultValue: []
		});
		customCueRepsByBundle.set(bundle.name, customCuesRep);
	}
});

nodecg.listenFor('addCustomCue', ({cueName, bundleName}, callback) => {
	const soundCuesRep = cueRepsByBundle.get(bundleName);
	const customCuesRep = customCueRepsByBundle.get(bundleName);
	if (!customCuesRep) {
		log.error(`Received "addCustomCue" for bundleName "${bundleName}", which has no customSoundCues replicant.`);
		return;
	}

	const allCues = soundCuesRep.value.concat(customCuesRep.value);

	// If this customCuesRep already has a cue by this name, abort.
	if (allCues.find(cue => cue.name === cueName)) {
		return callback('A cue by that name already exists.');
	}

	customCuesRep.value.push({
		name: cueName,
		volume: 30,
		file: null,
		createdTimestamp: Date.now()
	});

	callback();
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

function _makeCuesRepDefaultValue(bundle) {
	return bundle.soundCues.map(c => {
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
			cue.defaultFile = clone(cue.file);
		} else {
			cue.file = null;
		}

		if (cue.defaultVolume === undefined) {
			cue.volume = 30;
		} else {
			cue.volume = cue.defaultVolume;
		}

		return cue;
	});
}

module.exports = app;
