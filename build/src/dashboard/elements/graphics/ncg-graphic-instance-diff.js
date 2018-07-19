(function () {
	'use strict';

	let bundlesRep;

	/**
	 * @customElement
	 * @polymer
	 * @appliesMixin Polymer.MutableData
	 */
	class NcgGraphicInstanceDiff extends Polymer.MutableData(Polymer.Element) {
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
})();
