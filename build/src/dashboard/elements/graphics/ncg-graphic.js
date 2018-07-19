(function () {
	'use strict';

	/**
	 * @customElement
	 * @polymer
	 * @appliesMixin Polymer.MutableData
	 */
	class NcgGraphic extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'ncg-graphic';
		}

		static get properties() {
			return {
				graphic: {
					type: Object
				},
				instances: {
					type: Array
				},
				worstStatus: {
					type: String,
					reflectToAttribute: true,
					computed: '_computeWorstStatus(instances)'
				},
				responsiveMode: {
					type: String,
					reflectToAttribute: true,
					computed: '_computeResponsiveMode(_wide, _medium, _narrow)'
				},
				_collapseOpened: {
					type: Boolean
				},
				_wide: {
					type: Boolean
				},
				_medium: {
					type: Boolean
				},
				_narrow: {
					type: Boolean
				}
			};
		}

		ready() {
			super.ready();

			const clipboard = new Clipboard(this.$.copyButton);
			this._initClipboard(clipboard);
		}

		reloadAll() {
			this.$.reloadButton.disabled = true;
			window.socket.emit('graphic:requestRefreshAll', this.graphic, () => {
				this.$.reloadButton.disabled = false;
			});
		}

		toggleCollapse() {
			this.$.instancesCollapse.toggle();
		}

		/* istanbul ignore next: we dont currently test responsiveness */
		_computeResponsiveMode(_wide, _medium, _narrow) {
			if (_wide) {
				return 'wide';
			}

			if (_medium) {
				return 'medium';
			}

			if (_narrow) {
				return 'narrow';
			}
		}

		_initClipboard(clipboard) {
			/* istanbul ignore next: cant figure out how to test these */
			clipboard.on('success', () => {
				this.dispatchEvent(new CustomEvent('url-copy-success', {bubbles: true, composed: true}));
			});
			/* istanbul ignore next: cant figure out how to test these */
			clipboard.on('error', e => {
				this.dispatchEvent(new CustomEvent('url-copy-error', {bubbles: true, composed: true}));
				console.error(e);
			});
		}

		_calcShortUrl(graphicUrl) {
			return graphicUrl.split('/').slice(4).join('/');
		}

		_computeFullGraphicUrl(url) {
			const a = document.createElement('a');
			a.href = url;
			let absUrl = a.href;

			if (window.ncgConfig.login.enabled && window.token) {
				absUrl += `?key=${window.token}`;
			}

			return absUrl;
		}

		_computeWorstStatus(instances) {
			if (!instances) {
				return 'none';
			}

			const openInstances = instances.filter(instance => instance.open);
			if (openInstances.length <= 0) {
				return 'none';
			}

			const outOfDateInstance = openInstances.find(instance => instance.potentiallyOutOfDate);
			return outOfDateInstance ? 'out-of-date' : 'nominal';
		}

		_calcCount(singleInstance, instances) {
			if (singleInstance) {
				return 'S';
			}

			return instances ? instances.filter(instance => instance.open).length : '?';
		}

		_computeCollapseIcon(_collapseOpened) {
			return _collapseOpened ? 'unfold-less' : 'unfold-more';
		}

		_calcReloadAllDisabled(instances) {
			return !instances || instances.length <= 0;
		}
	}

	customElements.define(NcgGraphic.is, NcgGraphic);
})();
