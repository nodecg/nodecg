(function () {
	'use strict';

	Polymer({
		is: 'ncg-sounds',

		properties: {
			bundleName: String,
			soundCues: Array
		},

		ready() {
			const cueElsByName = {};
			this.bundleFaderRep = NodeCG.Replicant(`volume:${this.bundleName}`, '_sounds');
			const cuesRep = NodeCG.Replicant('soundCues', this.bundleName);
			const assetsRep = NodeCG.Replicant('assets:sounds', this.bundleName);

			this.bundleFaderRep.on('change', newVal => {
				this.$.bundleFader.value = newVal;
			});

			cuesRep.on('change', newVal => {
				// Update (or create) the ncg-sound-cue element for every cue in the Replicant.
				newVal.forEach(cue => {
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
				});

				// Remove cueEls that belong to soundCues that no longer exist.
				for (const name in cueElsByName) {
					if (!{}.hasOwnProperty.call(cueElsByName, name)) {
						continue;
					}

					const cueEl = cueElsByName[name];
					const index = newVal.findIndex(cue => cue.name === cueEl.name);
					if (index < 0) {
						Polymer.dom(this.$.cues).removeChild(cueEl);
					}
				}
			});

			assetsRep.on('change', newVal => {
				// Update the list of sound files for all assignable cues.
				for (const name in cueElsByName) {
					if (!{}.hasOwnProperty.call(cueElsByName, name)) {
						continue;
					}

					if (cueElsByName[name].assignable) {
						cueElsByName[name].soundFiles = newVal;
						cueElsByName[name]._generateOptions(newVal);
					}
				}
			});
		},

		_onBundleFaderChange(e) {
			this.bundleFaderRep.value = e.target.value;
		}
	});
})();
