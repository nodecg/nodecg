import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-toast/paper-toast.js';
import './ncg-sound-cue.js';
import * as Polymer from '@polymer/polymer';
class NcgSounds extends Polymer.PolymerElement {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-flex-none;
				@apply --layout-self-stretch;
				@apply --layout-vertical;
				display: block;
				max-width: 600px;
				white-space: nowrap;
				width: 100%;
			}

			#bundleFaderContainer {
				@apply --layout-horizontal;
				align-items: center;
				background-color: #525F78;
			}

			#bundleFaderContainer > span {
				@apply --paper-font-title;
				min-width: 166px; /* same width as "Master Fader" label */
				flex-grow: 1;
				flex-shrink: 0;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			#bundleFader {
				flex-shrink: 1;
				--paper-slider-input: {
					width: 80px;
				};
			}

			#cues {
				background-color: #2F3A4F;
				padding-bottom: 8px;
			}

			.card-content {
				padding: 0;
			}
		</style>

		<paper-card id="card" heading\$="[[bundleName]]">
			<div class="card-content">
				<div id="bundleFaderContainer">
					<span>Bundle Fader</span>
					<paper-slider id="bundleFader" min="0" max="100" step="1" on-change="_onBundleFaderChange" editable=""></paper-slider>
				</div>

				<div id="cues"></div>
			</div>
		</paper-card>
`;
	}

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
