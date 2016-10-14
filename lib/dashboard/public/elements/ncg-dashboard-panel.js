(function () {
	'use strict';

	Polymer({
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

		_openedChanged(newVal) {
			this.$.expandBtn.icon = newVal ? 'unfold-less' : 'unfold-more';
		},

		_headerColorChanged(newVal) {
			this.$.header.style.backgroundColor = newVal;
			this.$.buttons.style.background = this._calcLinearGradient(this._hexToRGB(newVal));
		},

		computeLocalStorageName(bundle, panel) {
			return [bundle, panel, 'opened'].join('.');
		},

		ready() {
			const infoDialog = new window.NcgDashboardPanelInfoDialog();
			infoDialog.bundle = this.bundle;
			document.body.appendChild(infoDialog);

			this.$.infoBtn.addEventListener('click', () => {
				infoDialog.open();
			});
		},

		toggleCollapse() {
			this.$.collapse.toggle();
		},

		initializeDefaultOpened() {
			this.opened = true;
		},

		_calcLinearGradient(rgb) {
			const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
			return `linear-gradient(to right, rgba(${rgbStr}, 0) 0px,rgba(${rgbStr}, 1) 10px)`;
		},

		_hexToRGB(hex) {
			// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
			const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
			hex = hex.replace(shorthandRegex, (m, r, g, b) => {
				return r + r + g + g + b + b;
			});

			const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		}
	});
})();
