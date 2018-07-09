'use strict';

// Native
const path = require('path');
const fs = require('fs');

// Packages
const clone = require('clone');
const defaults = require('json-schema-defaults');
const extend = require('extend');
const tv4 = require('tv4');

module.exports.parse = function (bundle, cfgPath) {
	if (!fs.existsSync(cfgPath)) {
		throw new Error(`bundleCfgPath "${cfgPath}" does not exist`);
	}

	let userConfig;
	try {
		userConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
	} catch (e) {
		throw new Error(`bundleCfgPath "${cfgPath}" could not be read. Ensure that it is valid JSON.`);
	}

	const cfgSchemaPath = path.resolve(bundle.dir, 'configschema.json');
	if (!fs.existsSync(cfgSchemaPath)) {
		return userConfig;
	}

	const schema = _parseSchema(bundle.name, cfgSchemaPath);
	const defaultConfig = defaults(schema);
	const userConfigValid = tv4.validateResult(userConfig, schema).valid;
	let finalConfig;

	// If the user's config is currently valid before any defaults from the schema have been added,
	// then ensure that adding the defaults won't suddenly invalidate the schema.
	// Else, if the user's config is currently invalid, then try adding the defaults and check if that makes it valid.
	if (userConfigValid) {
		finalConfig = clone(userConfig);
		for (const key in defaultConfig) {
			/* istanbul ignore if */
			if (!{}.hasOwnProperty.call(defaultConfig, key)) {
				continue;
			}

			const _foo = {};
			_foo[key] = defaultConfig[key];

			const _tempMerged = extend(true, _foo, clone(finalConfig));
			const result = tv4.validateResult(_tempMerged, schema);
			if (result.valid) {
				finalConfig = _tempMerged;
			}
		}
	} else {
		finalConfig = extend(true, defaultConfig, userConfig);
	}

	const result = tv4.validateResult(finalConfig, schema);
	if (result.valid) {
		return finalConfig;
	}

	throw new Error(`Config for bundle "${bundle.name}" is invalid:\n` +
		`${result.error.message} at ${result.error.dataPath}`);
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
