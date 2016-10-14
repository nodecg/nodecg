(function () {
	'use strict';

	Polymer({
		is: 'ncg-assets',

		properties: {
			files: Array,
			bundleName: String,
			categoryName: String,
			categoryTitle: String,
			allowedTypes: {
				type: Array,
				observer: '_onAllowedTypesChanged'
			},
			acceptsMsg: {
				type: String,
				computed: '_computeAcceptsMsg(allowedTypes)'
			}
		},

		ready() {
			this.$.replicant.addEventListener('change', e => {
				if (e.detail.newVal.length > 0) {
					this.$.empty.style.display = 'none';
				} else {
					this.$.empty.style.display = 'block';
				}
			});
		},

		_onAllowedTypesChanged(allowedTypes) {
			const prefixed = allowedTypes.map(type => '.' + type);
			this.$.uploader.accept = prefixed.join(',');
		},

		_computeAcceptsMsg(allowedTypes) {
			let msg = 'Accepts ';
			allowedTypes.forEach((type, index) => {
				type = type.toUpperCase();
				if (index === 0) {
					msg += type;
				} else if (index === allowedTypes.length - 1) {
					if (index === 1) {
						msg += ' and ' + type;
					} else {
						msg += ', and ' + type;
					}
				} else {
					msg += ', ' + type;
				}
			});
			return msg;
		},

		_handleDeleted(e) {
			this.$.toast.text = `Deleted ${e.target.file.base}`;
			this.$.toast.show();
		},

		_handleDeletionFailed(e) {
			this.$.toast.text = `Failed to delete ${e.target.file.base}`;
			this.$.toast.show();
		},

		openUploadDialog() {
			this.$.uploadDialog.open();
		},

		_onUploadBefore(event) {
			// Custom upload request url for file
			const file = event.detail.file;
			file.uploadTarget = `${event.target.target}/${file.name}`;
		},

		_onFileReject(event) {
			this.$.toast.text = `${event.detail.file.name} error: ${event.detail.error}`;
			this.$.toast.open();
		}
	});
})();
