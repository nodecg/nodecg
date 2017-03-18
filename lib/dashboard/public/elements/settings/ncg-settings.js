(function () {
	'use strict';

	Polymer({
		is: 'ncg-settings',

		ready() {
			if (window.ncgConfig.login.enabled && window.token) {
				this.$.key.textContent = window.token;
				this.$.copyKey.setAttribute('data-clipboard-text', window.token);
			}
		},

		attached() {
			const clipboard = new Clipboard(this.$.copyKey);
			clipboard.on('success', () => {
				this.$.settingsToast.show('Text copied to clipboard.');
			});
		},

		openShowKeyDialog() {
			this.$.showKeyDialog.open();
		},

		openResetKeyDialog() {
			this.$.resetKeyDialog.open();
		},

		resetKey() {
			window.socket.emit('regenerateToken', window.token, err => {
				if (err) {
					console.error(err);
					return;
				}

				document.location.reload();
			});
		}
	});
})();
