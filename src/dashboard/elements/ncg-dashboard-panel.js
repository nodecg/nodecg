/* global Raven */
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
		const infoDialog = document.createElement('ncg-dashboard-panel-info-dialog');
		infoDialog.withBackdrop = true;
		infoDialog.bundle = this.bundle;
		document.body.appendChild(infoDialog);

		this.$.infoBtn.addEventListener('click', () => {
			infoDialog.open();
		});

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

			// Sometimes, we just need to know when a dang click event occurred. No matter where it happened.
			// This adds a `panelClick` event to all panels.
			iframe.contentDocument.addEventListener('click', e => {
				document.dispatchEvent(new CustomEvent('panelClick', e.target));
			});
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

	_hexToRGB(hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, (m, r, g, b) => {
			return r + r + g + g + b + b;
		});

		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}
}

customElements.define('ncg-dashboard-panel', NcgDashboardPanel);
