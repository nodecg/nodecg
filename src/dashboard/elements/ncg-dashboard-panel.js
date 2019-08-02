import '@polymer/iron-collapse/iron-collapse.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/iron-localstorage/iron-localstorage.js';
import '@polymer/paper-styles/element-styles/paper-material-styles.js';
import '@polymer/paper-styles/typography.js';
import {afterNextRender} from '@polymer/polymer/lib/utils/render-status.js';
import * as Polymer from '@polymer/polymer';
/* global Raven */

const HEX_PARSE_SHORTHAND_REGEX = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const HEX_PARSE_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

class NcgDashboardPanel extends Polymer.PolymerElement {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme paper-material-styles">
			:host {
				display: inline-block;
				width: 128px;
			}

			:host([fullbleed]) {
				width: 100%!important;
				height: 100%!important;
			}

			:host(:not([fullbleed])) {
				@apply --paper-material-elevation-1;
			}

			:host([width="1"]) {
				width: 128px;
			}

			:host([width="2"]) {
				width: 272px;
			}

			:host([width="3"]) {
				width: 416px;
			}

			:host([width="4"]) {
				width: 560px;
			}

			:host([width="5"]) {
				width: 704px;
			}

			:host([width="6"]) {
				width: 848px;
			}

			:host([width="7"]) {
				width: 992px;
			}

			:host([width="8"]) {
				width: 1136px;
			}

			:host([width="9"]) {
				width: 1280px;
			}

			:host([width="10"]) {
				width: 1424px;
			}

			#header {
				position: relative;
				color: var(--google-grey-100);
				@apply --layout-horizontal;
				@apply --layout-end-justified;
				@apply --layout-center;
				@apply --layout-flex-none;
				@apply --paper-font-title;
				overflow: hidden;
			}

			#header a {
				color: inherit;
			}

			#displayTitle {
				position: absolute;
				left: 15px;
				top: 6px;
			}

			#buttons {
				@apply --layout-horizontal;
				@apply --layout-center;
				padding-left: 8px;
				transform: translateX(100%);
				transition: transform 200ms ease;
			}

			#more {
				position: absolute;
				right: 10px;
				top: 8px;
			}

			#buttonsContainer {
				z-index: 1;
			}

			#header:hover #buttons {
				transform: translateX(0%);
			}

			#dragHandle {
				cursor: -webkit-grab;
				cursor: -moz-grab;
				cursor: grab;
			}

			#dragHandle:active {
				cursor: -webkit-grabbing;
				cursor: -moz-grabbing;
				cursor: grabbing;
			}

			#body {
				min-height: 1px;
				padding: 0;
				background-color: #f5f5f5;
			}

			paper-icon-button[hidden] {
				/* For whatever reason, paper-icon-button doesn't specify its own [hidden] style.
				   https://github.com/PolymerElements/paper-icon-button/issues/103 */
				display: none !important;
			}

			:host([fullbleed]) {
				@apply --layout-vertical;
			}

			/* When fullbleed, buttons are always visible */
			:host([fullbleed]) #buttons {
				transform: translateX(0%);
			}

			:host([fullbleed]) #collapse {
				@apply --layout-flex;
				@apply --layout-vertical;
			}

			:host([fullbleed]) #body {
				@apply --layout-flex;
			}

			:host([fullbleed]) ::slotted(iframe) {
				height: 100%;
			}
		</style>

		<iron-localstorage name="{{computeLocalStorageName(bundle, panel)}}" value="{{opened}}" on-iron-localstorage-load-empty="initializeDefaultOpened"></iron-localstorage>

		<div id="header">
			<span id="displayTitle">[[displayTitle]]</span>
			<div id="buttonsContainer">
				<iron-icon id="more" icon="chevron-left"></iron-icon>
				<div id="buttons">
					<a href="[[standaloneUrl]]" target="_blank">
						<paper-icon-button id="openStandalone" icon="open-in-new"></paper-icon-button>
					</a>

					<paper-icon-button id="expandBtn" on-click="toggleCollapse" icon="unfold-less" hidden="[[fullbleed]]"></paper-icon-button>

					<paper-icon-button id="dragHandle" icon="open-with" hidden="[[fullbleed]]"></paper-icon-button>
				</div>
			</div>
		</div>

		<iron-collapse id="collapse" opened="{{opened}}" transitioning="{{transitioning}}">
			<div id="body">
				<slot id="slot"></slot>
			</div>
		</iron-collapse>
`;
	}

	static get is() {
		return 'ncg-dashboard-panel';
	}

	static get properties() {
		return {
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
			},
			width: {
				type: Number,
				reflectToAttribute: true
			},
			transitioning: {
				type: Boolean,
				notify: true
			},
			fullbleed: {
				type: Boolean,
				reflectToAttribute: true
			}
		};
	}

	ready() {
		super.ready();

		afterNextRender(this, () => {
			const distributedNodes = this.$.slot.assignedNodes({flatten: true});
			const iframe = distributedNodes.find(el => el.tagName === 'IFRAME');

			// If Raven is loaded, use it to report errors in panels to Sentry.io.
			if (typeof Raven !== 'undefined') {
				iframe.contentWindow.addEventListener('error', event => {
					Raven.captureException(event.error);
				});
				iframe.contentWindow.addEventListener('unhandledrejection', err => {
					Raven.captureException(err.reason);
				});
			}

			if (!this.fullbleed) {
				if (iframe.contentWindow.document.readyState === 'complete') {
					this._attachIframeResize(iframe);
				} else {
					iframe.addEventListener('load', () => {
						this._attachIframeResize(iframe);
					});
				}
			}
		});
	}

	_attachIframeResize(iframe) {
		window.iFrameResize({
			log: false,
			resizeFrom: 'child',
			heightCalculationMethod: 'documentElementOffset',
			onResized: data => {
				this.$.collapse.updateSize('auto', false);
				data.iframe.dispatchEvent(new CustomEvent('iframe-resized'));
			}
		}, iframe);
	}

	connectedCallback() {
		super.connectedCallback();

		const {src} = this.querySelector('iframe');
		this.standaloneUrl = `${src}?standalone=true`;
	}

	toggleCollapse() {
		this.$.collapse.toggle();
	}

	initializeDefaultOpened() {
		this.opened = true;
	}

	_openedChanged(newVal) {
		this.$.expandBtn.icon = newVal ? 'unfold-less' : 'unfold-more';
	}

	_headerColorChanged(newVal) {
		this.$.header.style.backgroundColor = newVal;
		this.$.buttons.style.background = this._calcLinearGradient(this._hexToRGB(newVal));
	}

	computeLocalStorageName(bundle, panel) {
		return [bundle, panel, 'opened'].join('.');
	}

	_calcLinearGradient(rgb) {
		const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
		return `linear-gradient(to right, rgba(${rgbStr}, 0) 0px,rgba(${rgbStr}, 1) 10px)`;
	}

	/* istanbul ignore next: tseems to confuse coverage */
	_hexToRGB(hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		hex = hex.replace(HEX_PARSE_SHORTHAND_REGEX, (m, r, g, b) => {
			return r + r + g + g + b + b;
		});

		const result = HEX_PARSE_REGEX.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}
}

customElements.define('ncg-dashboard-panel', NcgDashboardPanel);
