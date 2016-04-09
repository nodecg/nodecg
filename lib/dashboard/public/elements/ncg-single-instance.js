(function () {
	'use strict';

	Polymer({
		is: 'ncg-single-instance',

		properties: {
			url: String
		},

		kill: function () {
			window.socket.emit('killGraphic', this.url);
		}
	});
})();
