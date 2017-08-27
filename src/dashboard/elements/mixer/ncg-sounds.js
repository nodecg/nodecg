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
			soundCues: Array,
			enableCustomCues: {
				type: Boolean,
				reflectToAttribute: true
			}
		};
	}

	ready() {
		super.ready();

		const cueElsByName = {};
		const customCueElsByName = {};
		this.bundleFaderRep = NodeCG.Replicant(`volume:${this.bundleName}`, '_sounds');
		const cuesRep = NodeCG.Replicant('soundCues', this.bundleName);
		this.customCuesRep = NodeCG.Replicant('customSoundCues', this.bundleName);

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

		if (this.enableCustomCues) {
			this.customCuesRep.on('change', newVal => {
				// Update (or create) the ncg-sound-cue element for every cue in the Replicant.
				newVal.forEach(cue => {
					if (!customCueElsByName[cue.name]) {
						customCueElsByName[cue.name] = document.createElement('ncg-sound-cue');
						customCueElsByName[cue.name].addEventListener('delete', () => {
							const indexToSplice = this.customCuesRep.value.findIndex(({name}) => {
								return name === cue.name;
							});

							this.customCuesRep.value.splice(indexToSplice, 1);
						});
						customCueElsByName[cue.name].custom = true;
						customCueElsByName[cue.name].createdTimestamp = cue.createdTimestamp;
						this.$.customCues.appendChild(customCueElsByName[cue.name]);
					}

					customCueElsByName[cue.name].name = cue.name;
					customCueElsByName[cue.name].assignable = true;
					customCueElsByName[cue.name].file = cue.file;
					customCueElsByName[cue.name].volume = cue.volume;
					customCueElsByName[cue.name]._cueRef = cue;
					customCueElsByName[cue.name].bundleName = this.bundleName; // Must be last
				});

				// Remove cueEls that belong to soundCues that no longer exist.
				for (const name in customCueElsByName) {
					if (!{}.hasOwnProperty.call(customCueElsByName, name)) {
						continue;
					}

					const cueEl = customCueElsByName[name];

					const index = newVal.findIndex(cue => cue.name === cueEl.name);
					if (index < 0) {
						this.$.customCues.removeChild(cueEl);
						delete customCueElsByName[name];
					}
				}
			});
		}
	}

	openAddCustomCueDialog() {
		return this.$.addCustomCueDialog.open();
	}

	addCustomCueDialogAccepted() {
		this.addCustomCue(this.newCustomCueName);
		this.newCustomCueName = '';
	}

	addCustomCue(cueName) {
		NodeCG.sendMessageToBundle('addCustomCue', '_sounds', {
			cueName,
			bundleName: this.bundleName
		}, errorMsg => {
			this.$.addCustomCueToast.hide();
			if (errorMsg) {
				this.$.addCustomCueToast.show(`Failed to add "${cueName}": ${errorMsg}`);
			} else {
				this.$.addCustomCueToast.show(`Successfully added "${cueName}"!`);
			}
		});
	}

	_onBundleFaderChange(e) {
		this.bundleFaderRep.value = e.target.value;
	}
}

customElements.define('ncg-sounds', NcgSounds);
