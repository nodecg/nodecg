// Native
import * as path from 'path';
import * as fs from 'fs';

// Packages
import clone from 'clone';
import defaults from 'json-schema-defaults';
import extend from 'extend';
import tv4 from 'tv4';

export function parse(bundleName: string, bundleDir: string, cfgPath: string): Record<string, any> {
	if (!fs.existsSync(cfgPath)) {
		throw new Error(`bundleCfgPath "${cfgPath}" does not exist`);
	}

	let userConfig;
	try {
		userConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
	} catch (_: unknown) {
		throw new Error(`bundleCfgPath "${cfgPath}" could not be read. Ensure that it is valid JSON.`);
	}

	const cfgSchemaPath = path.resolve(bundleDir, 'configschema.json');
	if (!fs.existsSync(cfgSchemaPath)) {
		return userConfig;
	}

	const schema = _parseSchema(bundleName, cfgSchemaPath);
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

			const _foo: Record<string, any> = {};
			_foo[key] = defaultConfig[key];

			const _tempMerged: Record<string, any> = extend(true, _foo, clone(finalConfig));
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

	throw new Error(
		`Config for bundle "${bundleName}" is invalid:\n${result.error.message as string} at ${result.error.dataPath!}`,
	);
}

export function parseDefaults(bundleName: string, bundleDir: string): Record<string, any> {
	const cfgSchemaPath = path.resolve(bundleDir, 'configschema.json');
	if (fs.existsSync(cfgSchemaPath)) {
		const schema = _parseSchema(bundleName, cfgSchemaPath);
		return defaults(schema);
	}

	return {};
}

function _parseSchema(bundleName: string, schemaPath: string): Record<string, any> {
	try {
		return JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf8' }));
	} catch (_: unknown) {
		throw new Error(
			`configschema.json for bundle "${bundleName}" could not be read. Ensure that it is valid JSON.`,
		);
	}
}
