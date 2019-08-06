import '@polymer/paper-card/paper-card.js';
import './ncg-asset-category.js';
import * as Polymer from '@polymer/polymer';
import {MutableData} from '@polymer/polymer/lib/mixins/mutable-data';

const collectionsRep = new NodeCG.Replicant('collections', '_assets');

class NcgAssets extends MutableData(Polymer.PolymerElement) {
	static get template() {
		return Polymer.html`
		<style include="nodecg-theme">
			:host {
				@apply --layout-vertical;
				max-width: 600px;
				width: 100%;
			}

			.assets-divider {
				border-bottom: 1px solid #2F3A4F;
				box-sizing: border-box;
			}

			.assets-divider:last-of-type {
				display: none;
			}

			.card-content {
				padding: 0;
				background-color: #525F78;
			}
		</style>

		<template is="dom-repeat" items="[[collections]]" as="collection">
			<paper-card heading\$="[[collection.name]]">
				<div class="card-content">
					<template is="dom-repeat" items="[[collection.categories]]" as="category" mutable-data="">
						<ncg-asset-category collection-name="[[collection.name]]" category="[[category]]">
						</ncg-asset-category>
						<div class="assets-divider"></div>
					</template>
				</div>
			</paper-card>
		</template>
`;
	}

	static get is() {
		return 'ncg-assets';
	}

	ready() {
		super.ready();

		collectionsRep.on('change', newVal => {
			this.collections = newVal;
		});
	}
}

customElements.define('ncg-assets', NcgAssets);
