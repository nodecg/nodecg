import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/paper-slider/paper-slider.js';
import '@polymer/paper-styles/typography.js';
import '../ui/ui-select.js';
import * as Polymer from '@polymer/polymer';
class NcgSoundCue extends Polymer.PolymerElement {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-horizontal;
				align-items: center;
			}

			#leftWrapper {
				min-width: 0;
				padding-right: 8px;
				@apply --layout-vertical;
				@apply --layout-flex;
				@apply --layout-center-justified;
			}

			#name {
				@apply --paper-font-title;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			#select {
				display: none;
				width: 150px;
				@apply --layout-flex-none;
			}

			paper-slider {
				@apply --layout-flex-none;
				--paper-slider-input: {
					width: 80px;
				}
			}

			@media (max-width: 500px) {
				#select {
					width: 120px;
				}

				paper-slider {
					width: 150px;
				}
			}
		</style>

		<div id="leftWrapper">
			<span id="name">[[name]]</span>
		</div>

		<ui-select id="select" on-change="_retargetFile"></ui-select>
		<paper-slider id="slider" min="0" max="100" step="1" on-change="_onSliderChange" editable=""></paper-slider>
`;
	}

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
			createdTimestamp: {
				type: Number
			}
		};
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
