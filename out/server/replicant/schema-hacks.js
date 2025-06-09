"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSchema = formatSchema;
const json_ptr_1 = require("json-ptr");
const json_1 = require("klona/json");
function stripHash(url) {
    const hashIndex = url.indexOf("#");
    if (hashIndex >= 0) {
        return url.slice(0, hashIndex);
    }
    return url;
}
function typeOf(value) {
    const type = {
        hasValue: false,
        isArray: false,
        isPOJO: false,
        isNumber: false,
    };
    if (typeof value !== "undefined" && value !== null) {
        type.hasValue = true;
        if (typeof value === "number") {
            type.isNumber = !isNaN(value);
        }
        else if (Array.isArray(value)) {
            type.isArray = true;
        }
        else {
            type.isPOJO =
                typeof value === "object" &&
                    !(value instanceof RegExp) &&
                    !(value instanceof Date);
        }
    }
    return type;
}
/**
 * Mutates an object in place, replacing all its JSON Refs with their dereferenced values.
 */
function replaceRefs(inputObj, currentFile, allFiles) {
    const type = typeOf(inputObj);
    if (!type.isPOJO && !type.isArray) {
        return;
    }
    const obj = inputObj;
    if (type.isPOJO) {
        let dereferencedData;
        let referenceFile;
        if (isFileReference(obj)) {
            const referenceUrl = resolveFileReference(obj.$ref, currentFile);
            referenceFile = allFiles.find((file) => file.url === referenceUrl);
            /* istanbul ignore next: in theory this isn't possible */
            if (!referenceFile) {
                throw new Error("Should have been a schema here but wasn't");
            }
            dereferencedData = referenceFile.data;
            // If this file reference also has a local reference appended to it,
            // we need to resolve that local reference within the file we just dereferenced.
            // Example: schemaRefTargetWithDef.json#/definitions/exampleDef
            const hashIndex = obj.$ref.indexOf("#");
            if (hashIndex >= 0) {
                const hashPath = obj.$ref.slice(hashIndex);
                dereferencedData = resolvePointerReference(dereferencedData, hashPath);
            }
        }
        else if (isPointerReference(obj)) {
            referenceFile = currentFile;
            dereferencedData = resolvePointerReference(currentFile.data, obj.$ref);
        }
        if (dereferencedData && referenceFile) {
            delete obj["$ref"];
            for (const key in dereferencedData) {
                if (key === "$schema") {
                    continue;
                }
                obj[key] = (0, json_1.klona)(dereferencedData[key]);
            }
            // Crawl this POJO or Array, looking for nested JSON References
            const keys = Object.keys(dereferencedData);
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = obj[key];
                replaceRefs(value, referenceFile, allFiles);
            }
        }
    }
    // Crawl this POJO or Array, looking for nested JSON References
    const keys = Object.keys(obj);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
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
    return typeof value["$ref"] === "string" && !value["$ref"].startsWith("#");
}
/**
 * Determines whether the given value is a JSON Pointer to another value in the same file.
 *
 * @param {*} value - The value to inspect
 * @returns {boolean}
 */
function isPointerReference(value) {
    return typeof value["$ref"] === "string" && value["$ref"].startsWith("#");
}
/**
 * Resolves the given JSON Reference URL against the specified file, and adds a new {@link File}
 * object to the schema if necessary.
 *
 * @param {string} url - The JSON Reference URL (may be absolute or relative)
 * @param {File} file - The file that the JSON Reference is in
 */
function resolveFileReference(url, file) {
    const { schema } = file;
    // Remove any hash from the URL, since this URL represents the WHOLE file, not a fragment of it
    url = stripHash(url);
    // Resolve the new file's absolute URL
    return schema.plugins.resolveURL({ from: file.url, to: url });
}
function resolvePointerReference(obj, ref) {
    return json_ptr_1.JsonPointer.get(obj, ref);
}
function formatSchema(inputObj, currentFile, allFiles) {
    const schema = replaceRefs(inputObj, currentFile, allFiles);
    /**
     * NodeCG's CLI uses `json-schema-to-typescript` to convert JSON schemas into TypeScript types with the ability to override the generated type (https://github.com/bcherny/json-schema-to-typescript#custom-schema-properties), which can be handy in certain situations.
        The problem is that these custom properties are not standard, and AJV will throw an error due to their presence.
        This ensures that the schema will be compliant by removing these custom properties and allowing the schema converter to customize the generated type if needed.
     */
    if (schema) {
        delete schema["tsType"];
        delete schema["tsEnumNames"];
    }
    return schema;
}
//# sourceMappingURL=schema-hacks.js.map