(function () {
	'use strict';

	Polymer({
		is: 'ncg-asset-file',

		properties: {
			deleting: {
				type: Boolean,
				observer: '_deletingChanged',
				value: false
			}
		},

		_deletingChanged(newVal) {
			this.$.spinner.style.display = newVal ? 'block' : 'none';
			this.$.delete.style.display = newVal ? 'none' : 'flex';
		},

		_handleDeleteClick() {
			this.deleting = true;

			fetch(this.file.url, {
				method: 'DELETE',
				credentials: 'include'
			}).then(response => {
				if (response.status === 410 || response.status === 200) {
					this.fire('deleted');
				} else {
					this.fire('deletion-failed');
				}

				this.deleting = false;
			});
		}
	});
})();
