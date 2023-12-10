import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-toast/paper-toast.js';
import '@vaadin/vaadin-upload/vaadin-upload.js';

// These get elided unless we do this hacky stuff to force typescript and webpack to keep them.
import * as keep1 from '../util-scrollable';
keep1;
import * as keep2 from './ncg-asset-file';
keep2;

import * as Polymer from '@polymer/polymer';
import { MutableData } from '@polymer/polymer/lib/mixins/mutable-data';

class NcgAssetCategory extends MutableData(Polymer.PolymerElement) {
	static get template(): HTMLTemplateElement {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				display: block;
				width: 100%;
				box-sizing: border-box;
			}

			#add {
				display: flex;
				align-items: center;
			}

			paper-card {
				width: 100%;
			}

			#header {
				@apply --layout-vertical;
				background-color: #525F78;
				padding: 12px 0;
			}

			#header-main {
				@apply --layout-center;
				@apply --layout-horizontal;
				@apply --layout-justified;
			}

			#title {
				@apply --paper-font-headline;
			}

			#files {
				background-color: #2F3A4F;
				max-height: 400px;
				margin: 0 -16px;
				padding-left: 16px;
				--util-scrollable: {
					padding: 0;
				};
				@apply --layout-vertical;
			}

			vaadin-upload {
				width: 400px;
				margin: 16px;
				--lumo-primary-text-color: var(--nodecg-brand-blue);
				--lumo-secondary-text-color: darkgray;
			}

			#acceptsMsg {
				margin-top: 8px;
				text-align: center;
			}

			#add {
				--nodecg-background-color: #00A651;
			}

			#add iron-icon {
				position: relative;
				top: -1px;
			}
		</style>

		<paper-toast id="toast"></paper-toast>

		<div id="header">
			<div id="header-main">
				<span id="title">[[category.title]]</span>
				<paper-button id="add" on-click="openUploadDialog">
					<iron-icon icon="add"></iron-icon>
					Add File(s)
				</paper-button>
			</div>


			<div id="empty">
				There are no assets in this category.
			</div>
		</div>

		<util-scrollable id="files">
			<template is="dom-repeat" items="[[files]]" as="file" mutable-data="">
				<ncg-asset-file file="[[file]]" on-deleted="_handleDeleted" on-deletion-failed="_handleDeletionFailed">
				</ncg-asset-file>
			</template>
		</util-scrollable>

		<!-- 2017/03/18: Had to remove with-backdrop during the dashboard re-write -->
		<paper-dialog id="uploadDialog">
			<paper-dialog-scrollable>
				<vaadin-upload id="uploader" target="/assets/[[collectionName]]/[[category.name]]" on-upload-start="refitUploadDialog" on-file-reject="_onFileReject" on-upload-success="_onUploadSuccess">
					<template is="dom-if" if="[[category.allowedTypes.length]]">
						<div id="acceptsMsg">[[acceptsMsg]]</div>
					</template>
				</vaadin-upload>
			</paper-dialog-scrollable>

			<div class="buttons">
				<paper-button dialog-dismiss="">Close</paper-button>
			</div>
		</paper-dialog>
`;
	}

	static get is(): string {
		return 'ncg-asset-category';
	}

	static get properties() {
		return {
			files: Array,
			collectionName: {
				type: String,
				reflectToAttribute: true,
			},
			category: Object,
			categoryName: {
				type: String,
				reflectToAttribute: true,
				computed: '_computeCategoryName(category.name)',
			},
			acceptsMsg: {
				type: String,
				computed: '_computeAcceptsMsg(category.allowedTypes)',
			},
			_successfulUploads: {
				type: Number,
				value: 0,
			},
			_assetCategoryReplicant: {
				type: Object,
			},
		};
	}

	static get observers(): string[] {
		return [
			'_onAllowedTypesChanged(category.allowedTypes)',
			'_computeAssetCategoryReplicant(category.name, collectionName)',
		];
	}

	override connectedCallback(): void {
		super.connectedCallback();
		this.$['uploadDialog'].fitInto = document.body
			.querySelector('ncg-dashboard')!
			.shadowRoot!.getElementById('pages');
		this.$['uploadDialog'].resetFit();
	}

	refitUploadDialog(): void {
		this.$['uploadDialog'].refit();
	}

	_onAllowedTypesChanged(allowedTypes: string[]): void {
		const prefixed = allowedTypes.map((type) => '.' + type);
		this.$['uploader'].accept = prefixed.join(',');
	}

	_computeAcceptsMsg(allowedTypes: string[]): string {
		let msg = 'Accepts ';
		allowedTypes.forEach((type, index) => {
			type = type.toUpperCase();
			if (index === 0) {
				msg += type;
			} else if (index === allowedTypes.length - 1) {
				if (index === 1) {
					msg += ' and ' + type;
				} else {
					msg += ', and ' + type;
				}
			} else {
				msg += ', ' + type;
			}
		});
		return msg;
	}

	_handleDeleted(e: any): void {
		this.$['toast'].text = `Deleted ${e.target.file.base}`;
		this.$['toast'].show();
	}

	_handleDeletionFailed(e: any): void {
		this.$['toast'].text = `Failed to delete ${e.target.file.base}`;
		this.$['toast'].show();
	}

	openUploadDialog(): void {
		this.$['uploadDialog'].open();
		this.refitUploadDialog();
	}

	_onFileReject(event: any): void {
		this.refitUploadDialog();
		this.$['toast'].text = `${event.detail.file.name} error: ${event.detail.error}`;
		this.$['toast'].open();
	}

	_onUploadSuccess(): void {
		this['_successfulUploads']++;
	}

	_computeCategoryName(categoryName: string): string {
		return categoryName;
	}

	_computeAssetCategoryReplicant(categoryName: string, collectionName: string): void {
		const newRep = NodeCG.Replicant(`assets:${categoryName}`, collectionName);
		const oldRep = this['_assetCategoryReplicant'];
		if (oldRep) {
			oldRep.removeEventListener('change');
		}

		newRep.on('change', (newVal) => {
			this['files'] = newVal;
			if (Array.isArray(newVal) && newVal.length > 0) {
				this.$['empty'].style.display = 'none';
			} else {
				this.$['empty'].style.display = 'block';
			}
		});
		this['_assetCategoryReplicant'] = newRep;
	}
}

customElements.define(NcgAssetCategory.is, NcgAssetCategory);
