import "@polymer/iron-collapse/iron-collapse.js";
import "@polymer/iron-icons/iron-icons.js";
import "@polymer/iron-localstorage/iron-localstorage.js";
import "@polymer/paper-icon-button/paper-icon-button.js";

// These get elided unless we do this hacky stuff to force typescript and webpack to keep them.
import * as keep1 from "./ncg-graphic";
keep1;

import * as Polymer from "@polymer/polymer";
import { MutableData } from "@polymer/polymer/lib/mixins/mutable-data";

import type { NodeCG } from "../../../../types/nodecg";

/**
 * @customElement
 * @polymer
 * @appliesMixin MutableData
 */
class NcgGraphicsGroup extends MutableData(Polymer.PolymerElement) {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-flex-none;
				@apply --layout-vertical;
				margin-bottom: 12px;
			}

			#groupHeader {
				@apply --layout-horizontal;
				@apply --layout-center;
				background-color: #3F4A5F;
				border-bottom: 3px solid var(--nodecg-brand-blue);
				color: white;
				cursor: pointer;
				height: 40px;
				margin-bottom: 8px;
				user-select: none;
			}

			#groupHeader:hover {
				background-color: #4A5366;
			}

			#groupName {
				font-size: 16px;
				font-style: normal;
				font-weight: 500;
				line-height: normal;
				padding: 0 16px;
				@apply --layout-flex;
			}

			#collapseButton {
				--paper-icon-button: {
					color: white;
					padding: 4px;
					width: 32px;
					height: 32px;
				}
			}

			#collapseButton iron-icon {
				--iron-icon-width: 24px;
				--iron-icon-height: 24px;
			}

			#groupContent {
				padding-left: 8px;
			}
		</style>

		<iron-localstorage 
			name="[[_computeStorageKey(bundleName, groupName)]]" 
			value="{{_opened}}" 
			on-iron-localstorage-load-empty="_initializeDefaultOpened">
		</iron-localstorage>

		<div id="groupHeader" on-tap="toggleCollapse">
			<div id="groupName">[[groupName]]</div>
			<paper-icon-button 
				id="collapseButton"
				icon="[[_computeCollapseIcon(_opened)]]"
				on-tap="toggleCollapse">
			</paper-icon-button>
		</div>

		<iron-collapse id="collapse" opened="{{_opened}}" no-animation="">
			<div id="groupContent">
				<template is="dom-repeat" items="[[graphics]]" as="graphic" mutable-data="">
					<ncg-graphic 
						graphic="[[graphic]]" 
						instances="[[_calcGraphicInstances(bundleName, graphic, instances)]]">
					</ncg-graphic>
				</template>
			</div>
		</iron-collapse>
`;
	}

	static get is() {
		return "ncg-graphics-group";
	}

	static get properties() {
		return {
			bundleName: {
				type: String,
			},
			groupName: {
				type: String,
			},
			graphics: {
				type: Array,
			},
			instances: {
				type: Array,
			},
			_opened: {
				type: Boolean,
				notify: true,
			},
		};
	}

	toggleCollapse() {
		this.$.collapse.toggle();
	}

	_initializeDefaultOpened() {
		this._opened = true;
	}

	_computeCollapseIcon(opened: boolean) {
		return opened ? "unfold-less" : "unfold-more";
	}

	_computeStorageKey(bundleName: string, groupName: string) {
		return `${bundleName}_${groupName}_graphics_group_opened`;
	}

	_calcGraphicInstances(
		bundleName: string,
		graphic: NodeCG.Bundle.Graphic,
		instances?: NodeCG.GraphicsInstance[],
	) {
		if (!instances) {
			return [];
		}

		return instances.filter((instance) => {
			return (
				instance.bundleName === bundleName &&
				instance.pathName.endsWith(graphic.file)
			);
		});
	}
}

customElements.define("ncg-graphics-group", NcgGraphicsGroup);
