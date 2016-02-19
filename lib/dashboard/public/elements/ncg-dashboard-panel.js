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
				reflectToAttribute: true,
				observer: '_openedChanged'
			},
			headerColor: {
				type: String,
				reflectToAttribute: true,
				observer: '_headerColorChanged'
			}
		},

		_openedChanged: function (newVal) {
			this.$.expandBtn.icon = newVal ? 'unfold-less' : 'unfold-more';
		},

		_headerColorChanged: function (newVal) {
			this.$.header.style.backgroundColor = newVal;
			this.$.buttons.style.background = this._calcLinearGradient(this._hexToRGB(newVal));
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
		},

		_calcLinearGradient: function (rgb) {
			var rgbStr = rgb.r + ',' + rgb.g + ',' + rgb.b;
			return 'linear-gradient(to right, rgba(' + rgbStr + ',0) 0px,rgba(' + rgbStr + ',1) 10px)';
		},

		_hexToRGB: function (hex) {
			// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, function (m, r, g, b) {
				return r + r + g + g + b + b;
			});

			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		}
	});
})();
