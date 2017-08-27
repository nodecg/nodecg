class NcgSoundCue extends Polymer.Element {
	static get is() {
		return 'ncg-sound-cue';
	}

	static get properties() {
		return {
			name: String,
			bundleName: {
				type: String,
				observer: '_bundleNameChanged'
			},
			assignable: {
				type: Boolean,
				observer: '_assignableChanged'
			},
			file: {
				type: Object,
				observer: '_fileChanged'
			},
			defaultFile: Object,
			volume: {
				type: Number,
				observer: '_volumeChanged'
			},
			_cueRef: Object,
			soundFiles: Array,
			custom: {
				type: Boolean,
				reflectToAttribute: true,
				value: false
			},
			createdTimestamp: {
				type: Number
			}
		};
	}

	parseTimestamp(timestamp) {
		const date = new Date(timestamp);
		return date.toISOString().slice(0, 10);
	}

	emitDelete() {
		this.dispatchEvent(new CustomEvent('delete', {bubbles: true, composed: true}));
	}

	_bundleNameChanged(bundleName) {
		if (this._assetsRepInitialized) {
			return;
		}

		this._assetsRepInitialized = true;
		const assetsRep = NodeCG.Replicant('assets:sounds', bundleName);
		assetsRep.setMaxListeners(50);
		assetsRep.on('change', newVal => {
			if (this.assignable) {
				this.soundFiles = newVal;
				this._generateOptions(newVal);
			}
		});
	}

	_assignableChanged(newVal) {
		this.$.select.style.display = newVal ? 'block' : 'none';
	}

	_fileChanged(newVal) {
		if (newVal) {
			if (newVal.default) {
				this.$.select.value = 'default';
			} else {
				this.$.select.value = newVal.base;
			}
		} else {
			this.$.select.value = 'none';
		}
	}

	_volumeChanged(newVal) {
		this.$.slider.value = newVal;
	}

	_generateOptions(soundFiles) {
		// Remove all existing options
		while (this.$.select.item(0)) {
			this.$.select.remove(0);
		}

		// Create "none" option.
		const noneOption = document.createElement('option');
		noneOption.innerText = 'None';
		noneOption.value = 'none';
		if (!this.file) {
			noneOption.setAttribute('selected', 'true');
		}
		this.$.select.add(noneOption);

		// Create "default" option, if applicable.
		if (this.defaultFile) {
			const defaultOption = document.createElement('option');
			defaultOption.value = 'default';
			defaultOption.innerText = 'Default';
			if (this.file && this.file.default) {
				defaultOption.setAttribute('selected', 'true');
			}
			this.$.select.add(defaultOption);
		}

		// Add options for each uploaded sound file.
		if (soundFiles instanceof Array) {
			soundFiles.forEach((f, index) => {
				const option = document.createElement('option');
				option.value = f.base;
				option.innerText = f.base;
				option.replicantIndex = index;
				if (this.file && f.base === this.file.base) {
					option.setAttribute('selected', 'true');
				}
				this.$.select.add(option);
			});
		}
	}

	_retargetFile() {
		const selectValue = this.$.select.value;
		if (selectValue === 'none') {
			this._cueRef.file = null;
		} else if (selectValue === 'default') {
			this._cueRef.file = this.defaultFile;
		} else {
			this._cueRef.file = this.soundFiles[this.$.select.selectedOptions[0].replicantIndex];
		}
	}

	_onSliderChange(e) {
		this._cueRef.volume = e.target.value;
	}
}

customElements.define('ncg-sound-cue', NcgSoundCue);
