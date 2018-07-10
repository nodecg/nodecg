class NcgSettings extends Polymer.Element {
	static get is() {
		return 'ncg-settings';
	}

	static get properties() {
		return {};
	}

	ready() {
		super.ready();

		if (window.ncgConfig.login.enabled && window.token) {
			this.$.key.textContent = window.token;
			this.$.copyKey.setAttribute('data-clipboard-text', window.token);
		}

		const clipboard = new Clipboard(this.$.copyKey);
		clipboard.on('success', /* istanbul ignore next: hard to test clipboard things */() => {
			this.$.settingsToast.show('Key copied to clipboard.');
		});
	}

	/* istanbul ignore next: trivial */
	openShowKeyDialog() {
		this.$.showKeyDialog.open();
	}

	/* istanbul ignore next: trivial */
	openResetKeyDialog() {
		this.$.resetKeyDialog.open();
	}

	resetKey() {
		window.socket.emit('regenerateToken', window.token, /* istanbul ignore next */err => {
			if (err) {
				console.error(err);
				return;
			}

			document.location.reload();
		});
	}
}

customElements.define('ncg-settings', NcgSettings);
