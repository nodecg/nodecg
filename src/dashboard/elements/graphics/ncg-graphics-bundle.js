(function () {
	'use strict';

	/**
	 * @customElement
	 * @polymer
	 * @appliesMixin Polymer.MutableData
	 */
	class NcgGraphicsBundle extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'ncg-graphics-bundle';
		}

		static get properties() {
			return {
				bundle: Object,
				instances: Array
			};
		}

		showReloadAllConfirmDialog() {
			this.$.reloadAllConfirmDialog.open();
		}

		_calcGraphicInstances(bundle, graphic, instances) {
			if (!graphic || !Array.isArray(instances)) {
				return [];
			}

			return instances.filter(instance => {
				return instance.bundleName === bundle.name &&
					instance.pathName === graphic.url;
			});
		}

		_handleReloadAllConfirmDialogClose(e) {
			if (e.detail.confirmed) {
				this.$.reloadButton.disabled = true;
				window.socket.emit('graphic:requestBundleRefresh', this.bundle.name, () => {
					this.$.reloadButton.disabled = false;
				});
			}
		}
	}

	customElements.define(NcgGraphicsBundle.is, NcgGraphicsBundle);
})();
