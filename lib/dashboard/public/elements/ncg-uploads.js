/* global Polymer */
(function () {
	'use strict';

	/* eslint-disable new-cap */
	Polymer({
	/* eslint-enable new-cap */

		is: 'ncg-uploads',

		properties: {
			bundleName: String
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
		}
	});
})();
