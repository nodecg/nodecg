/* global Polymer */
(function () {
	'use strict';

	/* eslint-disable new-cap */
	Polymer({
	/* eslint-enable new-cap */

		is: 'ncg-single-instance',

		properties: {
			url: String
		},

		kill: function () {
			window.socket.emit('killGraphic', this.url);
		}
	});
})();
