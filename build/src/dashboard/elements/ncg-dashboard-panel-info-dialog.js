class NcgDashboardPanelInfoDialog extends Polymer.mixinBehaviors([
	Polymer.NeonAnimationRunnerBehavior,
	Polymer.PaperDialogBehavior
], Polymer.Element) {
	static get is() {
		return 'ncg-dashboard-panel-info-dialog';
	}

	static get properties() {
		return {
			bundle: {
				type: String,
				observer: 'bundleChanged'
			}
		};
	}

	ready() {
		super.ready();
		this.addEventListener('neon-animation-finish', this._onNeonAnimationFinish);
	}

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
}

customElements.define('ncg-dashboard-panel-info-dialog', NcgDashboardPanelInfoDialog);
