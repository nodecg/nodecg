(function () {
	'use strict';

	Polymer({
		is: 'ncg-sounds',

		properties: {
			bundleName: String,
			soundCues: Array
		},

		ready: function () {
			var cueElsByName = {};
			this.bundleFaderRep = NodeCG.Replicant(`volume:${this.bundleName}`, '_sounds');
			var cuesRep = NodeCG.Replicant('soundCues', this.bundleName);
			var uploadsRep = NodeCG.Replicant('uploads:sounds', this.bundleName);

			this.bundleFaderRep.on('change', function (oldVal, newVal) {
				this.$.bundleFader.value = newVal;
			}.bind(this));

			cuesRep.on('change', function (oldVal, newVal) {
				// Update (or create) the ncg-sound-cue element for every cue in the Replicant.
				newVal.forEach(function (cue) {
					if (!cueElsByName[cue.name]) {
						cueElsByName[cue.name] = document.createElement('ncg-sound-cue');
						Polymer.dom(this.$.cues).appendChild(cueElsByName[cue.name]);
					}

					cueElsByName[cue.name].name = cue.name;
					cueElsByName[cue.name].assignable = cue.assignable;
					cueElsByName[cue.name].defaultFile = cue.defaultFile;
					cueElsByName[cue.name].file = cue.file;
					cueElsByName[cue.name].volume = cue.volume;
					cueElsByName[cue.name]._cueRef = cue;
				}.bind(this));

				// Remove cueEls that belong to soundCues that no longer exist.
				for (const name in cueElsByName) {
					if (!cueElsByName.hasOwnProperty(name)) {
						continue;
					}

					const cueEl = cueElsByName[name];
					let index = newVal.findIndex(function (cue) {
						return cue.name === cueEl.name;
					});

					if (index < 0) {
						Polymer.dom(this.$.cues).removeChild(cueEl);
					}
				}
			}.bind(this));

			uploadsRep.on('change', function (oldVal, newVal) {
				// Update the list of sound files for all assignable cues.
				for (const name in cueElsByName) {
					if (!cueElsByName.hasOwnProperty(name)) {
						continue;
					}

					if (cueElsByName[name].assignable) {
						cueElsByName[name].soundFiles = newVal;
					}
				}
			});
		},

		_onBundleFaderChange(e) {
			this.bundleFaderRep.value = e.target.value;
		}
	});
})();
