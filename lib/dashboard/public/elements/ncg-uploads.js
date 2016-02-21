/* global Polymer */
(function () {
	'use strict';

	/* eslint-disable new-cap */
	Polymer({
		/* eslint-enable new-cap */

		is: 'ncg-uploads',

		properties: {
			bundleName: String,
			allowedTypesArray: {
				type: Array,
				observer: '_onAllowedTypesChanged'
			},
			acceptsMsg: {
				type: String,
				computed: '_computeAcceptsMsg(allowedTypesArray)'
			}
		},

		_onAllowedTypesChanged: function (allowedTypes) {
			var prefixed = allowedTypes.map(function (type) {
				return '.' + type;
			});

			this.$.uploader.accept = prefixed.join(',');
		},

		_computeAcceptsMsg: function (allowedTypes) {
			var msg = 'Accepts ';
			allowedTypes.forEach(function (type, index) {
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

		_handleDeleted: function (e) {
			this.$.toast.text = 'Deleted ' + e.target.file.base;
			this.$.toast.show();
		},

		_handleDeletionFailed: function (e) {
			this.$.toast.text = 'Failed to delete ' + e.target.file.base;
			this.$.toast.show();
		},

		openUploadDialog: function () {
			this.$.uploadDialog.open();
		},

		_onUploadBefore: function (event) {
			// Custom upload request url for file
			var file = event.detail.file;
			file.uploadTarget = event.target.target + '/' + file.name;
		},

		_onFileReject: function (event) {
			this.$.toast.text = event.detail.file.name + ' error: ' + event.detail.error;
			this.$.toast.open();
		}
	});
})();
