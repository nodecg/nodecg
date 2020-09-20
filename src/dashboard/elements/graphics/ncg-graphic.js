import '@polymer/iron-collapse/iron-collapse.js';
import '@polymer/iron-icons/hardware-icons.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-media-query/iron-media-query.js';
import '@polymer/paper-button/paper-button.js';
import './ncg-graphic-instance.js';
import * as Polymer from '@polymer/polymer';
import {MutableData} from '@polymer/polymer/lib/mixins/mutable-data';

/**
 * @customElement
 * @polymer
 * @appliesMixin MutableData
 */
class NcgGraphic extends MutableData(Polymer.PolymerElement) {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-vertical;
				@apply --layout-flex-none;
				white-space: nowrap;
			}

			:host(:not(:last-child)) {
				margin-bottom: 20px;
			}

			#details {
				@apply --layout-horizontal;
				@apply --layout-flex-none;
				height: 60px;
			}

			#indicator {
				@apply --layout-flex-none;
				background-color: #CACACA;
				width: 9px;
			}

			:host([worst-status="nominal"]) #indicator {
				background-color: #00A651;
			}

			:host([worst-status="out-of-date"]) #indicator {
				background-color: #FFC700;
			}

			#counter {
				@apply --layout-center-center;
				@apply --layout-flex-none;
				@apply --layout-horizontal;
				background-color: #525F78;
				color: #FFFFFF;
				font-size: 24px;
				font-style: normal;
				font-weight: 500;
				left: 9px;
				line-height: normal;
				text-align: center;
				width: 38px;
			}

			#urlAndResolution {
				@apply --layout-flex;
				background-color: #525F78;
				margin-right: 1px;
				min-width: 0;
			}

			#url {
				color: white;
				font-size: 16px;
				font-style: normal;
				font-weight: 500;
				letter-spacing: 0.018em;
				line-height: normal;
				max-width: 100%;
				min-width: 0;
				overflow: hidden;
				text-decoration: underline;
				text-overflow: ellipsis;
				text-transform: uppercase;
			}

			#resolution {
				font-size: 14px;
				font-style: normal;
				font-weight: 500;
				line-height: normal;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			#copyButton,
			#reloadButton {
				--paper-button: {
					--nodecg-background-color: #6155BD;
				}
			}

			#reloadButton iron-icon {
				--iron-icon-height: 29px;
				--iron-icon-width: 29px;
			}

			#collapseButton {
				--paper-button: {
					--nodecg-background-color: #525F78;
				}
			}

			#collapseButton iron-icon {
				--iron-icon-width: 40px;
				--iron-icon-height: 40px;
			}

			paper-button {
				@apply --layout-center-center;
				@apply --layout-flex-none;
				@apply --layout-horizontal;
				border-radius: 0;
				font-size: 14px;
				font-style: normal;
				font-weight: 500;
				line-height: normal;
				margin: 0 1px;
				min-width: 0;
				padding: 0;
				width: 60px;
			}

			paper-button:last-child {
				margin-right: 0;
			}

			/* Start wide styles */
			:host([responsive-mode="wide"]) #urlAndResolution {
				@apply --layout-horizontal;
				@apply --layout-center;
			}

			:host([responsive-mode="wide"]) #resolution {
				@apply --layout-flex-none;
				box-sizing: border-box;
				margin-left: auto;
				padding: 0 4px;
				text-align: center;
				width: 90px;
			}

			:host([responsive-mode="wide"]) #resolution:before,
			:host([responsive-mode="wide"]) #resolution:after {
				background: #EFF0EC;
				height: 50px;
				width: 1px;
			}

			:host([responsive-mode="wide"]) #reloadButton {
				width: 115px;
			}

			:host([responsive-mode="wide"]) #reloadButton iron-icon {
				margin-left: -6px;
				margin-right: -1px;
			}
			/* End wide styles */

			:host(:not([responsive-mode="wide"])) #urlAndResolution {
				@apply --layout-center-justified;
				@apply --layout-start;
				@apply --layout-vertical;
				padding-right: 6px;
			}

			:host(:not([responsive-mode="narrow"])) #copyButton {
				width: 115px;
			}

			:host([responsive-mode="narrow"]) #copyButton-text {
				display: none;
			}

			:host(:not([responsive-mode="wide"])) #reloadButton-text {
				display: none;
			}

			:host(:not([responsive-mode="narrow"])) #counter {
				padding-right: 8px;
			}
		</style>

		<iron-media-query query="(min-width: 641px)" query-matches="{{_wide}}"></iron-media-query>
		<iron-media-query query="(min-width: 521px) and (max-width: 640px)" query-matches="{{_medium}}"></iron-media-query>
		<iron-media-query query="(max-width: 520px)" query-matches="{{_narrow}}"></iron-media-query>

		<div id="details">
			<div id="indicator"></div>

			<div id="counter">[[_calcCount(graphic.singleInstance, instances)]]</div>

			<div id="urlAndResolution">
				<a id="url" href\$="[[_computeFullGraphicUrl(graphic.url)]]" target="_blank" title="[[_calcShortUrl(graphic.url)]]">
					[[_calcShortUrl(graphic.url)]]
				</a>
				<div id="resolution">[[graphic.width]]x[[graphic.height]]</div>
			</div>

			<paper-button id="copyButton" data-clipboard-text\$="[[_computeFullGraphicUrl(graphic.url)]]">
				<iron-icon icon="content-copy"></iron-icon>
				<span id="copyButton-text">&nbsp;Copy URL</span>
			</paper-button>

			<paper-button id="reloadButton" on-tap="reloadAll" disabled="[[_calcReloadAllDisabled(instances)]]">
				<iron-icon icon="refresh"></iron-icon>
				<span id="reloadButton-text">&nbsp;Reload</span>
			</paper-button>

			<paper-button id="collapseButton" on-tap="toggleCollapse">
				<iron-icon icon="[[_computeCollapseIcon(_collapseOpened)]]"></iron-icon>
			</paper-button>
		</div>

		<iron-collapse id="instancesCollapse" opened="{{_collapseOpened}}" no-animation="">
			<template is="dom-repeat" items="[[instances]]" as="instance" mutable-data="">
				<ncg-graphic-instance responsive-mode="[[responsiveMode]]" graphic="[[graphic]]" instance="[[instance]]">
				</ncg-graphic-instance>
			</template>
		</iron-collapse>
`;
	}

	static get is() {
		return 'ncg-graphic';
	}

	static get properties() {
		return {
			graphic: {
				type: Object
			},
			instances: {
				type: Array
			},
			worstStatus: {
				type: String,
				reflectToAttribute: true,
				computed: '_computeWorstStatus(instances)'
			},
			responsiveMode: {
				type: String,
				reflectToAttribute: true,
				computed: '_computeResponsiveMode(_wide, _medium, _narrow)'
			},
			_collapseOpened: {
				type: Boolean
			},
			_wide: {
				type: Boolean
			},
			_medium: {
				type: Boolean
			},
			_narrow: {
				type: Boolean
			}
		};
	}

	ready() {
		super.ready();

		const clipboard = new window.ClipboardJS(this.$.copyButton);
		this._initClipboard(clipboard);
		this.$.url.addEventListener('dragstart', this._onDrag.bind(this));
	}

	reloadAll() {
		this.$.reloadButton.disabled = true;
		window.socket.emit('graphic:requestRefreshAll', this.graphic, () => {
			this.$.reloadButton.disabled = false;
		});
	}

	toggleCollapse() {
		this.$.instancesCollapse.toggle();
	}

	/* istanbul ignore next: we dont currently test responsiveness */
	_computeResponsiveMode(_wide, _medium, _narrow) {
		if (_wide) {
			return 'wide';
		}

		if (_medium) {
			return 'medium';
		}

		if (_narrow) {
			return 'narrow';
		}
	}

	_initClipboard(clipboard) {
		/* istanbul ignore next: cant figure out how to test these */
		clipboard.on('success', () => {
			this.dispatchEvent(new CustomEvent('url-copy-success', {bubbles: true, composed: true}));
		});
		/* istanbul ignore next: cant figure out how to test these */
		clipboard.on('error', e => {
			this.dispatchEvent(new CustomEvent('url-copy-error', {bubbles: true, composed: true}));
			console.error(e);
		});
	}

	_calcShortUrl(graphicUrl) {
		return graphicUrl.split('/').slice(4).join('/');
	}

	_computeFullGraphicUrl(url) {
		const a = document.createElement('a');
		a.href = url;
		let absUrl = a.href;

		if (window.ncgConfig.login.enabled && window.token) {
			absUrl += `?key=${window.token}`;
		}

		return absUrl;
	}

	_computeWorstStatus(instances) {
		if (!instances) {
			return 'none';
		}

		const openInstances = instances.filter(instance => instance.open);
		if (openInstances.length <= 0) {
			return 'none';
		}

		const outOfDateInstance = openInstances.find(instance => instance.potentiallyOutOfDate);
		return outOfDateInstance ? 'out-of-date' : 'nominal';
	}

	_calcCount(singleInstance, instances) {
		if (singleInstance) {
			return 'S';
		}

		return instances ? instances.filter(instance => instance.open).length : '?';
	}

	_computeCollapseIcon(_collapseOpened) {
		return _collapseOpened ? 'unfold-less' : 'unfold-more';
	}

	_calcReloadAllDisabled(instances) {
		return !instances || instances.length <= 0;
	}

	_onDrag(event) {
		const dragged = event.target;
		const obsURL = `${dragged.href}?layer-name=${this.graphic.file.replace('.html', '')}&layer-height=${
			this.graphic.height
		}&layer-width=${this.graphic.width}`;
		event.dataTransfer.setData('text/uri-list', obsURL);
	}
}

customElements.define(NcgGraphic.is, NcgGraphic);
