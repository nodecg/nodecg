class NcgSounds extends Polymer.Element {
	static get is() {
		return 'ncg-sounds';
	}

	static get properties() {
		return {
			bundleName: {
				type: String,
				reflectToAttribute: true
			},
			soundCues: Array
		};
	}

	ready() {
		super.ready();

		const cueElsByName = {};
		this.bundleFaderRep = NodeCG.Replicant(`volume:${this.bundleName}`, '_sounds');
		const cuesRep = NodeCG.Replicant('soundCues', this.bundleName);

		this.bundleFaderRep.on('change', newVal => {
			this.$.bundleFader.value = newVal;
		});

		cuesRep.on('change', newVal => {
			// Update (or create) the ncg-sound-cue element for every cue in the Replicant.
			newVal.forEach(cue => {
				if (!cueElsByName[cue.name]) {
					cueElsByName[cue.name] = document.createElement('ncg-sound-cue');
					this.$.cues.appendChild(cueElsByName[cue.name]);
				}

				cueElsByName[cue.name].name = cue.name;
				cueElsByName[cue.name].assignable = cue.assignable;
				cueElsByName[cue.name].defaultFile = cue.defaultFile;
				cueElsByName[cue.name].file = cue.file;
				cueElsByName[cue.name].volume = cue.volume;
				cueElsByName[cue.name]._cueRef = cue;
				cueElsByName[cue.name].bundleName = this.bundleName; // Must be last
			});

			// Remove cueEls that belong to soundCues that no longer exist.
			for (const name in cueElsByName) {
				if (!{}.hasOwnProperty.call(cueElsByName, name)) {
					continue;
				}

				const cueEl = cueElsByName[name];
				const index = newVal.findIndex(cue => cue.name === cueEl.name);
				if (index < 0) {
					this.$.cues.removeChild(cueEl);
					delete cueElsByName[name];
				}
			}
		});
	}

	_onBundleFaderChange(e) {
		this.bundleFaderRep.value = e.target.value;
	}
}

customElements.define('ncg-sounds', NcgSounds);
