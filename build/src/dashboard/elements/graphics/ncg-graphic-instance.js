(function () {
	'use strict';

	const pulseElement = document.createElement('div');
	setInterval(() => {
		pulseElement.dispatchEvent(new CustomEvent('pulse', {
			detail: {
				timestamp: Date.now()
			}
		}));
	}, 1000);

	/**
	 * @customElement
	 * @polymer
	 * @appliesMixin Polymer.MutableData
	 */
	class NcgGraphicInstance extends Polymer.MutableData(Polymer.Element) {
		static get is() {
			return 'ncg-graphic-instance';
		}

		static get properties() {
			return {
				responsiveMode: {
					type: String,
					reflectToAttribute: true
				},
				graphic: Object,
				instance: Object,
				status: {
					type: String,
					reflectToAttribute: true,
					computed: '_computeStatus(instance)'
				},
				statusHover: {
					type: Boolean,
					reflectToAttribute: true,
					value: false
				}
			};
		}

		ready() {
			super.ready();
			pulseElement.addEventListener('pulse', e => {
				this._pulse = e.detail.timestamp;
			});

			const showDiff = () => {
				clearTimeout(this._offTimeout);
				this._offTimeout = null;
				this.statusHover = true;
			};

			const hideDiff = immediate => {
				if (immediate) {
					clearTimeout(this._offTimeout);
					this._offTimeout = null;
					this.statusHover = false;
				} else if (!this._offTimeout) {
					this._offTimeout = setTimeout(() => {
						clearTimeout(this._offTimeout);
						this._offTimeout = null;
						this.statusHover = false;
					}, 250);
				}
			};

			this.$.indicatorIcon.addEventListener('mouseenter', () => {
				if (this.responsiveMode === 'narrow') {
					showDiff();
				}
			});
			this.$.status.addEventListener('mouseenter', showDiff);
			this.$.diff.addEventListener('mouseenter', showDiff);

			this.$.indicatorIcon.addEventListener('mouseleave', () => {
				if (this.responsiveMode === 'narrow') {
					hideDiff(false);
				}
			});
			this.$.status.addEventListener('mouseleave', () => hideDiff(false));
			this.$.diff.addEventListener('mouseleave', () => hideDiff(false));
			this.$.diff.addEventListener('close', () => hideDiff(true));
		}

		reload() {
			this.$.reloadButton.disabled = true;
			window.socket.emit('graphic:requestRefresh', this.instance, () => {
				this.$.reloadButton.disabled = false;
			});
		}

		kill() {
			this.$.killButton.disabled = true;
			window.socket.emit('graphic:requestKill', this.instance, () => {
				this.$.killButton.disabled = false;
			});
		}

		_computeStatus(instance) {
			if (!instance) {
				return '';
			}

			if (!instance.open) {
				return 'closed';
			}

			return instance.potentiallyOutOfDate ? 'out-of-date' : 'nominal';
		}

		_calcIndicatorIcon(status) {
			switch (status) {
				case 'nominal':
					return 'check';
				case 'out-of-date':
					return 'warning';
				default:
					return 'close';
			}
		}

		_calcStatusMessage(status, responsiveMode) {
			switch (status) {
				case 'nominal':
					return 'Latest';
				case 'out-of-date':
					return responsiveMode === 'wide' ? 'Potentially Out of Date' : 'Out of Date';
				case 'closed':
					return 'Closed';
				default:
					return 'Error';
			}
		}

		_calcTimeSince(timestamp) {
			return timeSince(timestamp);
		}
	}

	customElements.define(NcgGraphicInstance.is, NcgGraphicInstance);

	/* istanbul ignore next: not really easy or that important to test */
	function timeSince(date) {
		const seconds = Math.floor((new Date().getTime() / 1000) - (date / 1000));
		let interval = Math.floor(seconds / 31536000);

		if (interval > 1) {
			return interval + ' year';
		}

		interval = Math.floor(seconds / 2592000);
		if (interval > 1) {
			return interval + ' month';
		}

		interval = Math.floor(seconds / 86400);
		if (interval >= 1) {
			return interval + ' day';
		}

		interval = Math.floor(seconds / 3600);
		if (interval >= 1) {
			return interval + ' hour';
		}

		interval = Math.floor(seconds / 60);
		if (interval > 1) {
			return interval + ' min';
		}

		return Math.floor(seconds) + ' sec';
	}
})();
