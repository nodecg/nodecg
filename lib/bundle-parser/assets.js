'use strict';

const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});
const schema = require('../../schemas/asset-category.json');
const humanizeParseErrors = require('../util/humanize-parse-erros');

module.exports = function (pkg) {
	if (pkg.nodecg.assetCategories) {

		if (!Array.isArray(pkg.nodecg.assetCategories)) {
			throw new Error(`${pkg.name}'s nodecg.assetCategories is not an Array`);
		}

		return pkg.nodecg.assetCategories.map((category, index) => {
			const validate = ajv.compile(schema);
			const result = validate(category);

			if (!result) {
				throw new Error(`Parsing Panel #${index} failed because of the following errors:\n${humanizeParseErrors(validate.errors)}`);
			}

			if (category.name.toLowerCase() === 'sounds') {
				throw new Error('"sounds" is a reserved assetCategory name. ' +
					`Please change nodecg.assetCategories[${index}].name in bundle ${pkg.name}`);
			}

			return category;
		});
	}

	return [];
};
