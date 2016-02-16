/* global Polymer */
(function () {
	'use strict';

	window.NcgDashboardPanelInfoDialog = new Polymer({

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

		bundleChanged: function (newVal) {
			if (!newVal) {
				return;
			}

			var self = this;
			window.socket.emit('getBundleManifest', newVal, function (err, manifest) {
				if (err) {
					throw err;
				}

				self.manifest = manifest;
			});
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
		}

	});
})();
