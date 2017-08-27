/* global Raven */
class NcgDialog extends Polymer.mixinBehaviors([
	Polymer.NeonAnimationRunnerBehavior,
	Polymer.PaperDialogBehavior
], Polymer.Element) {
	static get is() {
		return 'ncg-dialog';
	}

	static get properties() {
		return {
			bundle: {
				type: String,
				reflectToAttribute: true
			},
			panel: {
				type: String,
				reflectToAttribute: true
			},
			width: {
				type: Number,
				reflectToAttribute: true
			}
		};
	}

	ready() {
		super.ready();

		this.addEventListener('neon-animation-finish', this._onNeonAnimationFinish);
		this.addEventListener('iron-overlay-opened', this._onIronOverlayOpened);
		this.addEventListener('iron-overlay-closed', this._onIronOverlayClosed);

		Polymer.RenderStatus.afterNextRender(this, () => {
			const iframe = this.querySelector('iframe');

			// If Raven is loaded, use it to report errors in panels to Sentry.io.
			if (typeof Raven !== 'undefined') {
				iframe.contentWindow.addEventListener('error', event => {
					Raven.captureException(event.error);
				});
				iframe.contentWindow.addEventListener('unhandledrejection', err => {
					Raven.captureException(err.reason);
				});
			}

			if (iframe.contentWindow.document.readyState === 'complete') {
				this._attachIframeResize(iframe);
			} else {
				iframe.addEventListener('load', () => {
					this._attachIframeResize(iframe);
				});
			}

			// Sometimes, we just need to know when a dang click event occurred. No matter where it happened.
			// This adds a `panelClick` event to all panels.
			iframe.contentDocument.addEventListener('click', e => {
				document.dispatchEvent(new CustomEvent('panelClick', e.target));
			});
		});
	}

	connectedCallback() {
		super.connectedCallback();

		const iframe = this.querySelector('iframe');
		iframe.addEventListener('iframe-resized', () => {
			this.refit();
		});
	}

	_attachIframeResize(iframe) {
		window.iFrameResize({
			log: false,
			resizeFrom: 'child',
			heightCalculationMethod: 'documentElementOffset',
			resizedCallback: data => {
				data.iframe.dispatchEvent(new CustomEvent('iframe-resized'));
			}
		}, iframe);
	}

	_renderOpened() {
		if (this.withBackdrop) {
			this.backdropElement.open();
		}
		this.playAnimation('entry');
	}

	_renderClosed() {
		if (this.withBackdrop) {
			this.backdropElement.close();
		}
		this.playAnimation('exit');
	}

	_onNeonAnimationFinish() {
		if (this.opened) {
			this._finishRenderOpened();
		} else {
			this._finishRenderClosed();
		}
	}

	_onIronOverlayOpened() {
		const iframeDocument = this.querySelector('iframe').contentDocument;
		iframeDocument.dispatchEvent(new CustomEvent('dialog-opened'));
	}

	_onIronOverlayClosed(e) {
		const iframeDocument = this.querySelector('iframe').contentDocument;
		if (e.detail.confirmed) {
			iframeDocument.dispatchEvent(new CustomEvent('dialog-confirmed'));
		} else {
			iframeDocument.dispatchEvent(new CustomEvent('dialog-dismissed'));
		}
	}
}

customElements.define('ncg-dialog', NcgDialog);
