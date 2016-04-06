(function () {
	'use strict';

	Polymer({
		is: 'ncg-uploaded-file',

		properties: {
			deleting: {
				type: Boolean,
				observer: '_deletingChanged',
				value: false
			}
		},

		_deletingChanged: function (newVal) {
			this.$.spinner.style.display = newVal ? 'block' : 'none';
			this.$.delete.style.display = newVal ? 'none' : 'flex';
		},

		_handleDeleteClick: function () {
			this.deleting = true;

			fetch(this.file.url, {method: 'DELETE', credentials: 'include'})
				.then(function (response) {
					if (response.status === 410 || response.status === 200) {
						this.fire('deleted');
						this.remove();
					} else {
						this.deleting = false;
						this.fire('deletion-failed');
					}
				}.bind(this));
		}
	});
})();
