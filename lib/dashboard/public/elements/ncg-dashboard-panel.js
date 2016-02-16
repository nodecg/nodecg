/* global Polymer */
(function () {
	'use strict';

	/* eslint-disable new-cap */
	Polymer({
	/* eslint-enable new-cap */

		is: 'ncg-dashboard-panel',
		properties: {
			displayTitle: {
				type: String,
				reflectToAttribute: true
			},
			bundle: {
				type: String,
				reflectToAttribute: true
			},
			panel: {
				type: String,
				reflectToAttribute: true
			},
			opened: {
				type: Boolean,
				reflectToAttribute: true
			},
			headerColor: {
				type: String,
				reflectToAttribute: true,
				observer: 'headerColorChanged'
			}
		},

		headerColorChanged: function (newVal) {
			this.$.header.style.backgroundColor = newVal;
		},

		computeLocalStorageName: function (bundle, panel) {
			return [bundle, panel, 'opened'].join('.');
		},

		ready: function () {
			var infoDialog = new window.NcgDashboardPanelInfoDialog();
			infoDialog.bundle = this.bundle;
			document.body.appendChild(infoDialog);

			this.$.infoBtn.addEventListener('click', function () {
				infoDialog.open();
			});
		},

		toggleCollapse: function () {
			this.$.collapse.toggle();
		},

		initializeDefaultOpened: function () {
			this.opened = true;
		}
	});
})();
