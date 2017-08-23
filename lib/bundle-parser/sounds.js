'use strict';

const path = require('path');
const fs = require('fs');

module.exports = function (bundle, pkg) {
	if (pkg.nodecg.soundCues) {
		if (!Array.isArray(pkg.nodecg.soundCues)) {
			throw new Error(`${pkg.name}'s nodecg.soundCues is not an Array`);
		}

		bundle.soundCues = pkg.nodecg.soundCues.map((cue, index) => {
			if (typeof cue.name !== 'string') {
				throw new Error(`nodecg.soundCues[${index}] in bundle ${pkg.name} lacks a "name" property`);
			}

			if (typeof cue.assignable === 'undefined') {
				cue.assignable = true;
			}

			if (cue.assignable) {
				bundle.hasAssignableSoundCues = true;
			}

			// Clamp default volume to 0-100.
			if (cue.defaultVolume) {
				cue.defaultVolume = Math.min(cue.defaultVolume, 100);
				cue.defaultVolume = Math.max(cue.defaultVolume, 0);
			}

			// Verify that defaultFile exists, if provided.
			if (cue.defaultFile) {
				const defaultFilePath = path.join(bundle.dir, cue.defaultFile);
				if (!fs.existsSync(defaultFilePath)) {
					throw new Error(`nodecg.soundCues[${index}].defaultFile in bundle ${pkg.name} does not exist`);
				}
			}

			return cue;
		});
	} else {
		bundle.soundCues = [];
	}
};
