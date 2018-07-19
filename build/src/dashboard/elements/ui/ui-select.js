(function () {
	'use strict';

	class UiSelect extends Polymer.Element {
		static get is() {
			return 'ui-select';
		}

		static get properties() {
			return {
				name: String,
				required: Boolean,
				label: String,
				value: {
					type: String,
					notify: true
				}
			};
		}

		ready() {
			super.ready();
			['item', 'add', 'remove'].forEach(methodToForward => {
				this[methodToForward] = this.$.select[methodToForward].bind(this.$.select);
			});
		}

		connectedCallback() {
			super.connectedCallback();

			if (this.label) {
				const labelOption = document.createElement('option');
				labelOption.label = '-- Select a ' + this.label + ' --';
				labelOption.value = '';
				this.$.select.add(labelOption);
			}

			// Move all Light DOM <option> elements into the local Shadow DOM.
			const options = this.querySelectorAll('option');
			options.forEach(option => {
				this.$.select.add(option);
			});

			this.$.select.selectedIndex = -1;
		}

		_selectChanged(e) {
			if (!e.target.value) {
				this.$.select.selectedIndex = -1;
			}
		}
	}

	customElements.define('ui-select', UiSelect);
})();
