import '@polymer/iron-icons/device-icons.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import './ncg-graphic-instance-diff.js';
import * as Polymer from '@polymer/polymer';
import {MutableData} from '@polymer/polymer/lib/mixins/mutable-data';
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
 * @appliesMixin MutableData
 */
class NcgGraphicInstance extends MutableData(Polymer.PolymerElement) {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-flex-none;
				@apply --layout-horizontal;
				box-sizing: border-box;
				font-size: 18px;
				font-style: normal;
				font-weight: 500;
				height: 35px;
				line-height: normal;
				margin-bottom: 5px;
				margin-left: 8px;
				margin-right: 8px;
				position: relative;
				white-space: nowrap;
			}

			:host(:first-child) {
				margin-top: 5px;
			}

			#indicator {
				@apply --layout-flex-none;
				background-color: #CACACA;
				width: 8px;
			}

			:host([status="nominal"]) #indicator {
				background-color: #00A651;
			}

			:host([status="out-of-date"]) #indicator {
				background-color: #FFC700;
			}

			#indicatorIcon {
				@apply --layout-center-center;
				@apply --layout-flex-none;
				@apply --layout-horizontal;
				background: #525F78;
				border-right: 1px solid #6F7D99;
				width: 38px;
			}

			:host([status="nominal"]) #indicatorIcon {
				color: #00A651;
			}

			:host([status="out-of-date"]) #indicatorIcon,
			:host([status="out-of-date"]) #status {
				color: #FFC700;
			}

			:host([status="out-of-date"]) #status {
				cursor: help;
			}

			#ip,
			#status,
			#duration {
				@apply --layout-center;
				@apply --layout-horizontal;
				background: #525F78;
				padding: 0 16px;
			}

			#ip {
				@apply --layout-flex;
				border-right: 1px solid #6F7D99;
				min-width: 0;
			}

			#ip-actual {
				overflow: hidden;
				text-overflow: ellipsis;
			}

			#status {
				@apply --layout-flex-none;
				border-right: 1px solid #6F7D99;
				width: 187px;
			}

			#duration {
				@apply --layout-flex-none;
				width: 120px;
				margin-right: 1px;
			}

			#duration-icon {
				margin-right: 6px;
				margin-top: -1px;
			}

			#reloadButton {
				--nodecg-background-color: #6155BD;
			}

			#killButton {
				--nodecg-background-color: #FF7575;
			}

			#diff {
				transition: opacity 150ms ease-in-out;
				z-index: 1;
				top: 38px;
				left: 40px
			}

			paper-button {
				@apply --layout-center-center;
				@apply --layout-flex-none;
				@apply --layout-horizontal;
				border-radius: 0;
				margin: 0 1px;
				min-width: 0;
				padding: 0;
				width: 40px;
			}

			paper-button:last-child {
				margin-right: 0;
			}

			:host([responsive-mode="medium"]) #status {
				width: 94px;
			}

			:host([responsive-mode="medium"]) #duration {
				width: 100px;
			}

			:host(:not([responsive-mode="wide"])) #ip,
			:host(:not([responsive-mode="wide"])) #status,
			:host(:not([responsive-mode="wide"])) #duration {
				padding: 0 12px;
			}

			:host([responsive-mode="narrow"]) #status {
				width: 91px;
			}

			:host([responsive-mode="narrow"]) #duration {
				width: 69px;
			}

			:host([responsive-mode="narrow"]) #status,
			:host([responsive-mode="narrow"]) #duration-icon {
				display: none;
			}

			:host([responsive-mode="narrow"]) #diff {
				left: 0;
			}

			:host([status="closed"]) {
				opacity: 0;
				transition: opacity 0.9s ease-out;
			}

			:host(:not([status="out-of-date"])) #diff {
				display: none;
			}

			:host([status="out-of-date"][status-hover]) #diff {
				opacity: 1;
				pointer-events: initial;
			}

			:host(:not([status-hover])) #diff {
				display: none;
				opacity: 0;
				pointer-events: none;
			}
		</style>

		<div id="indicator"></div>

		<div id="indicatorIcon">
			<iron-icon icon="[[_calcIndicatorIcon(status)]]"></iron-icon>
		</div>

		<div id="ip">
			<div id="ip-actual" title="[[instance.ipv4]]">[[instance.ipv4]]</div>
		</div>

		<div id="status">[[_calcStatusMessage(status, responsiveMode)]]</div>

		<div id="duration">
			<iron-icon id="duration-icon" icon="device:access-time"></iron-icon>
			<span id="duration-text">[[_calcTimeSince(instance.timestamp, _pulse)]]</span>
		</div>

		<paper-button id="reloadButton" on-tap="reload">
			<iron-icon icon="refresh"></iron-icon>
		</paper-button>

		<paper-button id="killButton" on-tap="kill" hidden="[[!graphic.singleInstance]]">
			<iron-icon icon="close"></iron-icon>
		</paper-button>

		<ncg-graphic-instance-diff id="diff" instance="[[instance]]"></ncg-graphic-instance-diff>
`;
	}

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
