import '@polymer/iron-icons/device-icons.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import * as Polymer from '@polymer/polymer';
import {MutableData} from '@polymer/polymer/lib/mixins/mutable-data';
let bundlesRep;

/**
 * @customElement
 * @polymer
 * @appliesMixin MutableData
 */
class NcgGraphicInstanceDiff extends MutableData(Polymer.PolymerElement) {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-center-center;
				@apply --layout-horizontal;
				background: #212121;
				font-family: Courier New,Courier,Lucida Sans Typewriter,Lucida Typewriter,monospace;
				font-size: 12px;
				max-width: 100%;
				padding: 0.5em 1em;
				padding-left: 0;
				position: absolute;
				white-space: normal;
			}

			#body {
				@apply --layout-flex;
				min-width: 0;
			}

			.orange {
				color: #F4C008;
				font-weight: bold;
			}

			.green {
				color: #00A651;
				font-weight: bold;
			}
		</style>

		<paper-icon-button icon="close" on-tap="close"></paper-icon-button>
		<div id="body">
			<div class="line" style="margin-bottom: 4px;">
				<span class="orange">Current:</span>
				<span class="details">
					[[instance.bundleVersion]] - [[instance.bundleGit.shortHash]] [[_formatCommitMessage(instance.bundleGit.message)]]
				</span>
			</div>
			<div class="line" style="margin-top: 4px;">
				<span class="green">Latest:&nbsp;</span>
				<span class="details">
					[[_bundleVersion]] - [[_bundleGit.shortHash]] [[_formatCommitMessage(_bundleGit.message)]]
				</span>
			</div>
		</div>
`;
	}

	static get is() {
		return 'ncg-graphic-instance-diff';
	}

	static get properties() {
		return {
			instance: Object
		};
	}

	static get observers() {
		return [
			'_updateBundleInfo(instance.bundleName)'
		];
	}

	ready() {
		super.ready();

		if (!bundlesRep) {
			bundlesRep = new NodeCG.Replicant('bundles', 'nodecg');
			bundlesRep.setMaxListeners(99);
		}

		bundlesRep.on('change', () => {
			this._updateBundleInfo();
		});
	}

	close() {
		this.dispatchEvent(new CustomEvent('close'));
	}

	_updateBundleInfo() {
		if (!bundlesRep || bundlesRep.status !== 'declared' || !Array.isArray(bundlesRep.value)) {
			return;
		}

		if (!this.instance || !this.instance.bundleName) {
			return;
		}

		const bundle = bundlesRep.value.find(bundle => bundle.name === this.instance.bundleName);
		if (!bundle) {
			return;
		}

		this._bundleVersion = bundle.version;
		this._bundleGit = bundle.git;
	}

	_formatCommitMessage(message) {
		if (!message) {
			return '[No commit message.]';
		}

		if (message.length > 50) {
			message = message.slice(0, 50);
			message += '…';
		}

		return `[${message}]`;
	}
}

customElements.define(NcgGraphicInstanceDiff.is, NcgGraphicInstanceDiff);
