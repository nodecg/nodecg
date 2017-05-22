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
	}

	connectedCallback() {
		super.connectedCallback();

		const iframe = this.querySelector('iframe');
		iframe.addEventListener('iframe-resized', () => {
			this.refit();
		});
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
