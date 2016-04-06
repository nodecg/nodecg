(function () {
	'use strict';

	Polymer({
		is: 'ncg-dialog',

		behaviors: [
			Polymer.PaperDialogBehavior,
			Polymer.NeonAnimationRunnerBehavior
		],

		properties: {
			panel: Object
		},

		listeners: {
			'neon-animation-finish': '_onNeonAnimationFinish',
			'iron-overlay-opened': '_onIronOverlayOpened',
			'iron-overlay-closed': '_onIronOverlayClosed'
		},

		attached: function () {
			var iframe = Polymer.dom(this).querySelector('iframe');
			iframe.addEventListener('iframe-resized', function () {
				this.refit();
			}.bind(this));
		},

		_renderOpened: function () {
			if (this.withBackdrop) {
				this.backdropElement.open();
			}
			this.playAnimation('entry');
		},

		_renderClosed: function () {
			if (this.withBackdrop) {
				this.backdropElement.close();
			}
			this.playAnimation('exit');
		},

		_onNeonAnimationFinish: function () {
			if (this.opened) {
				this._finishRenderOpened();
			} else {
				this._finishRenderClosed();
			}
		},

		_onIronOverlayOpened: function () {
			var iframeDocument = this.querySelector('iframe').contentDocument;
			iframeDocument.dispatchEvent(new CustomEvent('dialog-opened'));
		},

		_onIronOverlayClosed: function (e) {
			var iframeDocument = this.querySelector('iframe').contentDocument;
			if (e.detail.confirmed) {
				iframeDocument.dispatchEvent(new CustomEvent('dialog-confirmed'));
			} else {
				iframeDocument.dispatchEvent(new CustomEvent('dialog-dismissed'));
			}
		}
	});
})();
