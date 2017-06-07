class NcgAssets extends Polymer.Element {
	static get is() {
		return 'ncg-assets';
	}

	static get properties() {
		return {
			bundlesWithAssets: {
				type: Array,
				value: window.__renderData__.bundles.filter(bundle => {
					return bundle.hasAssignableSoundCues ||
						(bundle.assetCategories && bundle.assetCategories.length > 0);
				})
			}
		};
	}
}

customElements.define('ncg-assets', NcgAssets);
