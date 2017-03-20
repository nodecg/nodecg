(function () {
	'use strict';

	Polymer({
		is: 'ncg-dashboard-panel-info-dialog',

		properties: {
			bundle: {
				type: String,
				observer: 'bundleChanged'
			}
		},

		behaviors: [
			Polymer.PaperDialogBehavior,
			Polymer.NeonAnimationRunnerBehavior
		],

		listeners: {
			'neon-animation-finish': '_onNeonAnimationFinish'
		},

		bundleChanged(newVal) {
			if (!newVal) {
				return;
			}

			window.socket.emit('getBundleManifest', newVal, (err, manifest) => {
				if (err) {
					throw err;
				}

				this.manifest = manifest;
			});
		},

		_renderOpened() {
			if (this.withBackdrop) {
				this.backdropElement.open();
			}
			this.playAnimation('entry');
		},

		_renderClosed() {
			if (this.withBackdrop) {
				this.backdropElement.close();
			}
			this.playAnimation('exit');
		},

		_onNeonAnimationFinish() {
			if (this.opened) {
				this._finishRenderOpened();
			} else {
				this._finishRenderClosed();
			}
		}
	});
})();
