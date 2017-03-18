(function () {
	'use strict';

	Polymer({
		is: 'ncg-assets',

		properties: {
			bundlesWithAssets: {
				type: Array,
				value: window.__renderData__.bundles.filter(bundle => {
					return bundle.hasAssignableSoundCues ||
						(bundle.assetCategories && bundle.assetCategories.length > 0);
				})
			}
		}
	});
})();
