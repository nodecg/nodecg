'use strict';

module.exports = function (pkg) {
	if (pkg.nodecg.assetCategories) {
		if (!Array.isArray(pkg.nodecg.assetCategories)) {
			throw new Error(`${pkg.name}'s nodecg.assetCategories is not an Array`);
		}

		return pkg.nodecg.assetCategories.map((category, index) => {
			if (typeof category.name !== 'string') {
				throw new Error(`nodecg.assetCategories[${index}] in bundle ${pkg.name} lacks a "name" property`);
			}

			if (category.name.toLowerCase() === 'sounds') {
				throw new Error('"sounds" is a reserved assetCategory name. ' +
					`Please change nodecg.assetCategories[${index}].name in bundle ${pkg.name}`);
			}

			if (typeof category.title !== 'string') {
				throw new Error(`nodecg.assetCategories[${index}] in bundle ${pkg.name} lacks a "title" property`);
			}

			if (category.allowedTypes && !Array.isArray(category.allowedTypes)) {
				throw new Error(`nodecg.assetCategories[${index}].allowedTypes in bundle ${pkg.name} is not an Array`);
			}

			return category;
		});
	}

	return [];
};
