(function () {
	/* global Raven */

	const HEX_PARSE_SHORTHAND_REGEX = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	const HEX_PARSE_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

	class NcgDashboardPanel extends Polymer.Element {
		static get is() {
			return 'ncg-dashboard-panel';
		}

		static get properties() {
			return {
				displayTitle: {
					type: String,
					reflectToAttribute: true
				},
				bundle: {
					type: String,
					reflectToAttribute: true
				},
				panel: {
					type: String,
					reflectToAttribute: true
				},
				opened: {
					type: Boolean,
					reflectToAttribute: true,
					observer: '_openedChanged'
				},
				headerColor: {
					type: String,
					reflectToAttribute: true,
					observer: '_headerColorChanged'
				},
				width: {
					type: Number,
					reflectToAttribute: true
				},
				transitioning: {
					type: Boolean,
					notify: true
				},
				fullbleed: {
					type: Boolean,
					reflectToAttribute: true
				}
			};
		}

		ready() {
			super.ready();

			Polymer.RenderStatus.afterNextRender(this, () => {
				const distributedNodes = this.$.slot.assignedNodes({flatten: true});
				const iframe = distributedNodes.find(el => el.tagName === 'IFRAME');

				// If Raven is loaded, use it to report errors in panels to Sentry.io.
				if (typeof Raven !== 'undefined') {
					iframe.contentWindow.addEventListener('error', event => {
						Raven.captureException(event.error);
					});
					iframe.contentWindow.addEventListener('unhandledrejection', err => {
						Raven.captureException(err.reason);
					});
				}

				if (!this.fullbleed) {
					if (iframe.contentWindow.document.readyState === 'complete') {
						this._attachIframeResize(iframe);
					} else {
						iframe.addEventListener('load', () => {
							this._attachIframeResize(iframe);
						});
					}
				}
			});
		}

		_attachIframeResize(iframe) {
			window.iFrameResize({
				log: false,
				resizeFrom: 'child',
				heightCalculationMethod: 'documentElementOffset',
				resizedCallback: data => {
					this.$.collapse.updateSize('auto', false);
					data.iframe.dispatchEvent(new CustomEvent('iframe-resized'));
				}
			}, iframe);
		}

		connectedCallback() {
			super.connectedCallback();

			const src =	this.querySelector('iframe').src;
			this.standaloneUrl = `${src}?standalone=true`;
		}

		toggleCollapse() {
			this.$.collapse.toggle();
		}

		initializeDefaultOpened() {
			this.opened = true;
		}

		_openedChanged(newVal) {
			this.$.expandBtn.icon = newVal ? 'unfold-less' : 'unfold-more';
		}

		_headerColorChanged(newVal) {
			this.$.header.style.backgroundColor = newVal;
			this.$.buttons.style.background = this._calcLinearGradient(this._hexToRGB(newVal));
		}

		computeLocalStorageName(bundle, panel) {
			return [bundle, panel, 'opened'].join('.');
		}

		_calcLinearGradient(rgb) {
			const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
			return `linear-gradient(to right, rgba(${rgbStr}, 0) 0px,rgba(${rgbStr}, 1) 10px)`;
		}

		/* istanbul ignore next: tseems to confuse coverage */
		_hexToRGB(hex) {
			// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
			hex = hex.replace(HEX_PARSE_SHORTHAND_REGEX, (m, r, g, b) => {
				return r + r + g + g + b + b;
			});

			const result = HEX_PARSE_REGEX.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		}
	}

	customElements.define('ncg-dashboard-panel', NcgDashboardPanel);
})();
