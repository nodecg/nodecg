(function () {
	'use strict';

	Polymer({
		is: 'ncg-sound-cue',

		properties: {
			name: String,
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
			soundFiles: Array
		},

		_assignableChanged(newVal) {
			this.$.select.style.display = newVal ? 'block' : 'none';
		},

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
		},

		_volumeChanged(newVal) {
			this.$.slider.value = newVal;
		},

		_generateOptions(soundFiles) {
			// Remove all existing options
			while (this.$.select.item(0)) {
				this.$.select.remove(0);
			}

			// Create "none" option.
			var noneOption = document.createElement('option');
			noneOption.innerText = 'None';
			noneOption.value = 'none';
			if (!this.file) {
				noneOption.setAttribute('selected', true);
			}
			this.$.select.add(noneOption);

			// Create "default" option, if applicable.
			if (this.defaultFile) {
				var defaultOption = document.createElement('option');
				defaultOption.value = 'default';
				defaultOption.innerText = 'Default';
				if (this.file && this.file.default) {
					defaultOption.setAttribute('selected', true);
				}
				this.$.select.add(defaultOption);
			}

			// Add options for each uploaded sound file.
			soundFiles.forEach(function (f, index) {
				var option = document.createElement('option');
				option.value = f.base;
				option.innerText = f.base;
				option.replicantIndex = index;
				if (this.file && f.base === this.file.base) {
					option.setAttribute('selected', true);
				}
				this.$.select.add(option);
			}.bind(this));
		},

		_retargetFile() {
			const selectValue = this.$.select.value;
			if (selectValue === 'none') {
				this._cueRef.file = null;
			} else if (selectValue === 'default') {
				this._cueRef.file = this.defaultFile;
			} else {
				this._cueRef.file = this.soundFiles[this.$.select.selectedOptions[0].replicantIndex];
			}
		},

		_onSliderChange(e) {
			this._cueRef.volume = e.target.value;
		}
	});
})();
