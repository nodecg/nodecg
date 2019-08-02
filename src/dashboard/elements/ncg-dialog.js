/*
You may notice some oddness with this element. Namely that the `.buttons` div appears before the
`paper-dialog-scrollable` element in `dashboard.pug`, but in the below `<style>` tag I've forced
`.buttons` to have an `order` of `3`, making it appear after `paper-dialog-scrollable`.

This was done to fix a bizarre issue wherein any nodes placed after the `paper-dialog-scrollable`
were not appearing in the DOM. I do not know how or why this was happening, so this flexbox hack
is the only thing I could come up with. Let us never speak of this again.

Lange - 1/28/2016
*/
import {NeonAnimationRunnerBehavior} from '@polymer/neon-animation/neon-animation-runner-behavior.js';
import {PaperDialogBehavior} from '@polymer/paper-dialog-behavior/paper-dialog-behavior.js';
import '@polymer/paper-dialog-behavior/paper-dialog-shared-styles.js';
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';
import * as Polymer from '@polymer/polymer';
/* global Raven */
class NcgDialog extends mixinBehaviors([
	NeonAnimationRunnerBehavior,
	PaperDialogBehavior
], Polymer.PolymerElement) {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme paper-dialog-shared-styles">
			:host {
				background-color: #2F3A4F;
				display: flex;
				flex-direction: column;
				max-width: 100%;
				--paper-dialog-scrollable: {
					max-width: none;
				}
			}

			:host([width="1"]) {
				width: 128px;
			}

			:host([width="2"]) {
				width: 272px;
			}

			:host([width="3"]) {
				width: 416px;
			}

			:host([width="4"]) {
				width: 560px;
			}

			:host([width="5"]) {
				width: 704px;
			}

			:host([width="6"]) {
				width: 848px;
			}

			:host([width="7"]) {
				width: 992px;
			}

			:host([width="8"]) {
				width: 1136px;
			}

			:host([width="9"]) {
				width: 1280px;
			}

			:host([width="10"]) {
				width: 1424px;
			}

			/* TODO: check that this still does the right thing */
			:host > ::slotted(*:last-child) {
				margin-bottom: 0;
			}
		</style>

		<slot id="slot"></slot>
`;
	}

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

		afterNextRender(this, () => {
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
			onResized: data => {
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
		if (e.detail.confirmed && !e.detail.canceled) {
			iframeDocument.dispatchEvent(new CustomEvent('dialog-confirmed'));
		} else {
			iframeDocument.dispatchEvent(new CustomEvent('dialog-dismissed'));
		}
	}
}

customElements.define('ncg-dialog', NcgDialog);
