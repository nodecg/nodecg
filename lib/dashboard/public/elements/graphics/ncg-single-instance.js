(function () {
	'use strict';

	Polymer({
		is: 'ncg-single-instance',

		properties: {
			url: String
		},

		kill() {
			window.socket.emit('killGraphic', this.url);
		}
	});
})();
