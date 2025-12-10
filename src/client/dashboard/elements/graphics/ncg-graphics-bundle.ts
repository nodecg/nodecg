import "@polymer/paper-button/paper-button.js";
import "@polymer/paper-dialog/paper-dialog.js";

// These get elided unless we do this hacky stuff to force typescript and webpack to keep them.
import * as keep1 from "./ncg-graphic";
import * as keep2 from "./ncg-graphics-group";
keep1;
keep2;

import * as Polymer from "@polymer/polymer";
import { MutableData } from "@polymer/polymer/lib/mixins/mutable-data";

import type { NodeCG } from "../../../../types/nodecg";

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

		<!-- Ungrouped graphics -->
		<template is="dom-repeat" items="[[_ungroupedGraphics]]" as="graphic" mutable-data="">
			<ncg-graphic graphic="[[graphic]]" instances="[[_calcGraphicInstances(bundle, graphic, instances)]]">
			</ncg-graphic>
		</template>

		<!-- Grouped graphics -->
		<template is="dom-repeat" items="[[_graphicsGroups]]" as="group" mutable-data="">
			<ncg-graphics-group 
				bundle-name="[[bundle.name]]" 
				group-name="[[group.name]]" 
				graphics="[[group.graphics]]" 
				instances="[[instances]]">
			</ncg-graphics-group>
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
		return "ncg-graphics-bundle";
	}

	static get properties() {
		return {
			bundle: Object,
			instances: Array,
			_ungroupedGraphics: {
				type: Array,
				computed: "_computeUngroupedGraphics(bundle.graphics)",
			},
			_graphicsGroups: {
				type: Array,
				computed: "_computeGraphicsGroups(bundle.graphics)",
			},
		};
	}

	showReloadAllConfirmDialog() {
		this.$["reloadAllConfirmDialog"].open();
	}

	_calcGraphicInstances(
		bundle?: NodeCG.Bundle,
		graphic?: NodeCG.Bundle.Graphic,
		instances?: NodeCG.GraphicsInstance[],
	) {
		if (!graphic || !Array.isArray(instances) || !bundle) {
			return [];
		}

		return instances.filter(
			(instance) =>
				instance.bundleName === bundle.name &&
				instance.pathName === graphic.url,
		);
	}

	_computeUngroupedGraphics(graphics?: NodeCG.Bundle.Graphic[]) {
		if (!graphics) {
			return [];
		}
		const ungrouped = graphics.filter((graphic) => !graphic.group);
		return this._sortGraphics(ungrouped);
	}

	_computeGraphicsGroups(graphics?: NodeCG.Bundle.Graphic[]) {
		if (!graphics) {
			return [];
		}

		const groupedGraphics = graphics.filter((graphic) => graphic.group);
		const groupsMap = new Map<string, NodeCG.Bundle.Graphic[]>();

		groupedGraphics.forEach((graphic) => {
			const groupName = graphic.group!;
			if (!groupsMap.has(groupName)) {
				groupsMap.set(groupName, []);
			}
			groupsMap.get(groupName)!.push(graphic);
		});

		const groups = Array.from(groupsMap.entries()).map(([name, graphics]) => ({
			name,
			graphics: this._sortGraphics(graphics),
		}));

		groups.sort((a, b) => a.name.localeCompare(b.name));
		return groups;
	}

	/**
	 * Returns the sort category for an order value:
	 * - 0: positive/zero (appears first)
	 * - 1: undefined (appears in middle)
	 * - 2: negative (appears last)
	 */
	_getOrderCategory(order: number | undefined): number {
		if (order === undefined) return 1;
		if (order >= 0) return 0;
		return 2;
	}

	_sortGraphics(graphics: NodeCG.Bundle.Graphic[]) {
		// Sorting categories: positive/zero orders (front) → no order (middle) → negative orders (end)
		// This allows negative numbers to be used like Python's arr[-1] to place items at the end
		return graphics.slice().sort((a, b) => {
			const orderA = a.order;
			const orderB = b.order;

			const categoryA = this._getOrderCategory(orderA);
			const categoryB = this._getOrderCategory(orderB);

			// Different categories: sort by category
			if (categoryA !== categoryB) {
				return categoryA - categoryB;
			}

			// Same category: if both undefined, sort by name
			if (categoryA === 1) {
				const nameA = a.name ?? a.file;
				const nameB = b.name ?? b.file;
				return nameA.localeCompare(nameB);
			}

			// Both have orders in same category: sort numerically, then by name
			if (orderA !== orderB) {
				return orderA! - orderB!;
			}
			const nameA = a.name ?? a.file;
			const nameB = b.name ?? b.file;
			return nameA.localeCompare(nameB);
		});
	}

	_handleReloadAllConfirmDialogClose(e: any) {
		if (e.detail.confirmed) {
			this.$["reloadButton"].disabled = true;
			window.socket.emit(
				"graphic:requestBundleRefresh",
				this["bundle"].name,
				() => {
					this.$["reloadButton"].disabled = false;
				},
			);
		}
	}
}

customElements.define(NcgGraphicsBundle.is, NcgGraphicsBundle);
