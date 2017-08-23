'use strict';

const path = require('path');
const fs = require('fs');
const tv4 = require('tv4');
const defaults = require('json-schema-defaults');
const extend = require('extend');

module.exports.parse = function (bundle, cfgPath) {
	if (fs.existsSync(cfgPath)) {
		let userConfig;

		try {
			userConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
		} catch (e) {
			throw new Error(`bundleCfgPath "${cfgPath}" could not be read. Ensure that it is valid JSON.`);
		}

		const cfgSchemaPath = path.resolve(bundle.dir, 'configschema.json');
		if (fs.existsSync(cfgSchemaPath)) {
			const schema = _parseSchema(bundle.name, cfgSchemaPath);
			const defaultConfig = defaults(schema);
			const mergedConfig = extend(true, defaultConfig, userConfig);
			const result = tv4.validateResult(mergedConfig, schema);
			if (result.valid) {
				return mergedConfig;
			}

			throw new Error(`Config for bundle "${bundle.name}" is invalid:\n` +
				`${result.error.message} at ${result.error.dataPath}`);
		} else {
			return userConfig;
		}
	} else {
		throw new Error(`bundleCfgPath "${cfgPath}" does not exist`);
	}
};

module.exports.parseDefaults = function (bundle) {
	const cfgSchemaPath = path.resolve(bundle.dir, 'configschema.json');
	if (fs.existsSync(cfgSchemaPath)) {
		const schema = _parseSchema(bundle.name, cfgSchemaPath);
		return defaults(schema);
	}

	return {};
};

function _parseSchema(bundleName, schemaPath) {
	try {
		return JSON.parse(fs.readFileSync(schemaPath));
	} catch (e) {
		throw new Error(`configschema.json for bundle "${bundleName}" could not be read. ` +
			'Ensure that it is valid JSON.');
	}
}
