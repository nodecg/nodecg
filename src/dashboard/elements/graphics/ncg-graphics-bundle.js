import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-dialog/paper-dialog.js';
import './ncg-graphic.js';
import * as Polymer from '@polymer/polymer';
import {MutableData} from '@polymer/polymer/lib/mixins/mutable-data';

/**
 * @customElement
 * @polymer
 * @appliesMixin MutableData
 */
class NcgGraphicsBundle extends MutableData(Polymer.PolymerElement) {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-flex-none;
				@apply --layout-vertical;
				@apply --shadow-elevation-2dp;
				background: #2F3A4F;
				color: white;
				margin-bottom: 20px;
			}

			#titleBar {
				@apply --layout-horizontal;
				background-color: #525F78;
				border-bottom: 5px solid var(--nodecg-brand-blue);
				margin-bottom: 13px;
			}

			#bundleName {
				font-size: 24px;
				font-style: normal;
				font-weight: normal;
				line-height: normal;
				padding: 6px 17px;
				@apply --layout-flex;
			}

			#reloadButton {
				margin-left: 2px;
				margin-right: 0;
				min-width: 0;
				padding: 0;
			}

			#reloadButton iron-icon {
				--iron-icon-height: 29px;
				--iron-icon-width: 29px;
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
				width: 160px;
			}

			paper-dialog {
				background-color: #2F3A4F;
				color: white;
			}

			paper-dialog paper-button[dialog-dismiss] {
				--paper-button: {
					color: white;
					background-color: #C9513E;
				}
			}

			paper-dialog paper-button[dialog-confirm] {
				--paper-button: {
					color: white;
					background-color: #5BA664;
				}
			}
		</style>

		<div id="titleBar">
			<div id="bundleName">[[bundle.name]]</div>
			<paper-button id="reloadButton" class="nodecg-execute" on-tap="showReloadAllConfirmDialog">
				<iron-icon icon="refresh"></iron-icon>
				<span id="reloadButton-text">&nbsp;Reload All</span>
			</paper-button>
		</div>

		<template is="dom-repeat" items="[[bundle.graphics]]" as="graphic" mutable-data="">
			<ncg-graphic graphic="[[graphic]]" instances="[[_calcGraphicInstances(bundle, graphic, instances)]]">
			</ncg-graphic>
		</template>

		<paper-dialog id="reloadAllConfirmDialog" on-iron-overlay-closed="_handleReloadAllConfirmDialogClose">
			<h2>Confirm Reload</h2>

			<p>Are you sure you want to reload all open instances of <b>[[bundle.name]]</b> graphics?</p>

			<div class="buttons">
				<paper-button dialog-dismiss="" raised="">No, Cancel</paper-button>
				<paper-button dialog-confirm="" raised="" autofocus="">Yes, Reload</paper-button>
			</div>
		</paper-dialog>
`;
	}

	static get is() {
		return 'ncg-graphics-bundle';
	}

	static get properties() {
		return {
			bundle: Object,
			instances: Array
		};
	}

	showReloadAllConfirmDialog() {
		this.$.reloadAllConfirmDialog.open();
	}

	_calcGraphicInstances(bundle, graphic, instances) {
		if (!graphic || !Array.isArray(instances)) {
			return [];
		}

		return instances.filter(instance => {
			return instance.bundleName === bundle.name &&
              instance.pathName === graphic.url;
		});
	}

	_handleReloadAllConfirmDialogClose(e) {
		if (e.detail.confirmed) {
			this.$.reloadButton.disabled = true;
			window.socket.emit('graphic:requestBundleRefresh', this.bundle.name, () => {
				this.$.reloadButton.disabled = false;
			});
		}
	}
}

customElements.define(NcgGraphicsBundle.is, NcgGraphicsBundle);
