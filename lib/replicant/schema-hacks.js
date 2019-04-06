// Packages
const clone = require('clone');
const ptr = require('json-ptr');

// Crimes
const jsonSchemaLibTypeOf = require('json-schema-lib/lib/util/typeOf');
const jsonSchemaStripHash = require('json-schema-lib/lib/util/stripHash');

function replaceRefs(obj, currentFile, allFiles) {
	const type = jsonSchemaLibTypeOf(obj);
	if (!type.isPOJO && !type.isArray) {
		return;
	}

	if (type.isPOJO) {
		let dereferencedData;
		let referenceFile;
		if (isFileReference(obj)) {
			const referenceUrl = resolveFileReference(obj.$ref, currentFile);
			referenceFile = allFiles.find(file => {
				return file.url === referenceUrl;
			});

			/* istanbul ignore next: in theory this isn't possible */
			if (!referenceFile) {
				throw new Error('Should have been a schema here but wasn\'t');
			}

			dereferencedData = referenceFile.data;

			// If this file reference also has a local reference appended to it,
			// we need to resolve that local reference within the file we just dereferenced.
			// Example: schemaRefTargetWithDef.json#/definitions/exampleDef
			const hashIndex = obj.$ref.indexOf('#');
			if (hashIndex >= 0) {
				const hashPath = obj.$ref.slice(hashIndex);
				dereferencedData = resolvePointerReference(dereferencedData, hashPath);
			}
		} else if (isPointerReference(obj)) {
			referenceFile = currentFile;
			dereferencedData = resolvePointerReference(currentFile.data, obj.$ref);
		}

		if (dereferencedData && referenceFile) {
			delete obj.$ref;
			for (const key in dereferencedData) {
				if (key === '$schema') {
					continue;
				}

				obj[key] = clone(dereferencedData[key]);
			}

			// Crawl this POJO or Array, looking for nested JSON References
			const keys = Object.keys(dereferencedData);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const value = obj[key];
				replaceRefs(value, referenceFile, allFiles);
			}
		}
	}

	// Crawl this POJO or Array, looking for nested JSON References
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const value = obj[key];
		replaceRefs(value, currentFile, allFiles);
	}

	return obj;
}

/**
 * Determines whether the given value is a JSON Reference that points to a file
 * (as opposed to an internal reference, which points to a location within its own file).
 *
 * @param {*} value - The value to inspect
 * @returns {boolean}
 */
function isFileReference(value) {
	return typeof value.$ref === 'string' && value.$ref[0] !== '#';
}

/**
 * Determines whether the given value is a JSON Pointer to another value in the same file.
 *
 * @param {*} value - The value to inspect
 * @returns {boolean}
 */
function isPointerReference(value) {
	return typeof value.$ref === 'string' && value.$ref[0] === '#';
}

/**
 * Resolves the given JSON Reference URL against the specified file, and adds a new {@link File}
 * object to the schema if necessary.
 *
 * @param {string} url - The JSON Reference URL (may be absolute or relative)
 * @param {File} file - The file that the JSON Reference is in
 */
function resolveFileReference(url, file) {
	const {schema} = file;

	// Remove any hash from the URL, since this URL represents the WHOLE file, not a fragment of it
	url = jsonSchemaStripHash(url);

	// Resolve the new file's absolute URL
	return schema.plugins.resolveURL({from: file.url, to: url});
}

function resolvePointerReference(obj, ref) {
	return ptr.get(obj, ref);
}

module.exports = replaceRefs;
