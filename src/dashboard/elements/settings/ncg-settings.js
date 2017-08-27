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
		clipboard.on('success', () => {
			this.$.settingsToast.show('Key copied to clipboard.');
		});
	}

	openShowKeyDialog() {
		this.$.showKeyDialog.open();
	}

	openResetKeyDialog() {
		this.$.resetKeyDialog.open();
	}

	resetKey() {
		window.socket.emit('regenerateToken', window.token, err => {
			if (err) {
				console.error(err);
				return;
			}

			document.location.reload();
		});
	}
}

customElements.define('ncg-settings', NcgSettings);
