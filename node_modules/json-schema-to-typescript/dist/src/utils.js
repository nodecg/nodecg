"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFileAsJSONSchema = exports.isSchemaLike = exports.appendToDescription = exports.maybeStripDefault = exports.pathTransform = exports.escapeBlockComment = exports.log = exports.error = exports.generateName = exports.toSafeString = exports.stripExtension = exports.justName = exports.traverse = exports.Try = void 0;
const lodash_1 = require("lodash");
const path_1 = require("path");
const JSONSchema_1 = require("./types/JSONSchema");
const js_yaml_1 = __importDefault(require("js-yaml"));
// TODO: pull out into a separate package
function Try(fn, err) {
    try {
        return fn();
    }
    catch (e) {
        return err(e);
    }
}
exports.Try = Try;
// keys that shouldn't be traversed by the catchall step
const BLACKLISTED_KEYS = new Set([
    'id',
    '$defs',
    '$id',
    '$schema',
    'title',
    'description',
    'default',
    'multipleOf',
    'maximum',
    'exclusiveMaximum',
    'minimum',
    'exclusiveMinimum',
    'maxLength',
    'minLength',
    'pattern',
    'additionalItems',
    'items',
    'maxItems',
    'minItems',
    'uniqueItems',
    'maxProperties',
    'minProperties',
    'required',
    'additionalProperties',
    'definitions',
    'properties',
    'patternProperties',
    'dependencies',
    'enum',
    'type',
    'allOf',
    'anyOf',
    'oneOf',
    'not',
]);
function traverseObjectKeys(obj, callback, processed) {
    Object.keys(obj).forEach(k => {
        if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
            traverse(obj[k], callback, processed, k);
        }
    });
}
function traverseArray(arr, callback, processed) {
    arr.forEach((s, k) => traverse(s, callback, processed, k.toString()));
}
function traverseIntersection(schema, callback, processed) {
    if (typeof schema !== 'object' || !schema) {
        return;
    }
    const r = schema;
    const intersection = r[JSONSchema_1.Intersection];
    if (!intersection) {
        return;
    }
    if (Array.isArray(intersection.allOf)) {
        traverseArray(intersection.allOf, callback, processed);
    }
}
function traverse(schema, callback, processed = new Set(), key) {
    // Handle recursive schemas
    if (processed.has(schema)) {
        return;
    }
    processed.add(schema);
    callback(schema, key !== null && key !== void 0 ? key : null);
    if (schema.anyOf) {
        traverseArray(schema.anyOf, callback, processed);
    }
    if (schema.allOf) {
        traverseArray(schema.allOf, callback, processed);
    }
    if (schema.oneOf) {
        traverseArray(schema.oneOf, callback, processed);
    }
    if (schema.properties) {
        traverseObjectKeys(schema.properties, callback, processed);
    }
    if (schema.patternProperties) {
        traverseObjectKeys(schema.patternProperties, callback, processed);
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        traverse(schema.additionalProperties, callback, processed);
    }
    if (schema.items) {
        const { items } = schema;
        if (Array.isArray(items)) {
            traverseArray(items, callback, processed);
        }
        else {
            traverse(items, callback, processed);
        }
    }
    if (schema.additionalItems && typeof schema.additionalItems === 'object') {
        traverse(schema.additionalItems, callback, processed);
    }
    if (schema.dependencies) {
        if (Array.isArray(schema.dependencies)) {
            traverseArray(schema.dependencies, callback, processed);
        }
        else {
            traverseObjectKeys(schema.dependencies, callback, processed);
        }
    }
    if (schema.definitions) {
        traverseObjectKeys(schema.definitions, callback, processed);
    }
    if (schema.$defs) {
        traverseObjectKeys(schema.$defs, callback, processed);
    }
    if (schema.not) {
        traverse(schema.not, callback, processed);
    }
    traverseIntersection(schema, callback, processed);
    // technically you can put definitions on any key
    Object.keys(schema)
        .filter(key => !BLACKLISTED_KEYS.has(key))
        .forEach(key => {
        const child = schema[key];
        if (child && typeof child === 'object') {
            traverseObjectKeys(child, callback, processed);
        }
    });
}
exports.traverse = traverse;
/**
 * Eg. `foo/bar/baz.json` => `baz`
 */
function justName(filename = '') {
    return stripExtension((0, path_1.basename)(filename));
}
exports.justName = justName;
/**
 * Avoid appending "js" to top-level unnamed schemas
 */
function stripExtension(filename) {
    return filename.replace((0, path_1.extname)(filename), '');
}
exports.stripExtension = stripExtension;
/**
 * Convert a string that might contain spaces or special characters to one that
 * can safely be used as a TypeScript interface or enum name.
 */
function toSafeString(string) {
    // identifiers in javaScript/ts:
    // First character: a-zA-Z | _ | $
    // Rest: a-zA-Z | _ | $ | 0-9
    return (0, lodash_1.upperFirst)(
    // remove accents, umlauts, ... by their basic latin letters
    (0, lodash_1.deburr)(string)
        // replace chars which are not valid for typescript identifiers with whitespace
        .replace(/(^\s*[^a-zA-Z_$])|([^a-zA-Z_$\d])/g, ' ')
        // uppercase leading underscores followed by lowercase
        .replace(/^_[a-z]/g, match => match.toUpperCase())
        // remove non-leading underscores followed by lowercase (convert snake_case)
        .replace(/_[a-z]/g, match => match.substr(1, match.length).toUpperCase())
        // uppercase letters after digits, dollars
        .replace(/([\d$]+[a-zA-Z])/g, match => match.toUpperCase())
        // uppercase first letter after whitespace
        .replace(/\s+([a-zA-Z])/g, match => (0, lodash_1.trim)(match.toUpperCase()))
        // remove remaining whitespace
        .replace(/\s/g, ''));
}
exports.toSafeString = toSafeString;
function generateName(from, usedNames) {
    let name = toSafeString(from);
    if (!name) {
        name = 'NoName';
    }
    // increment counter until we find a free name
    if (usedNames.has(name)) {
        let counter = 1;
        let nameWithCounter = `${name}${counter}`;
        while (usedNames.has(nameWithCounter)) {
            nameWithCounter = `${name}${counter}`;
            counter++;
        }
        name = nameWithCounter;
    }
    usedNames.add(name);
    return name;
}
exports.generateName = generateName;
function error(...messages) {
    var _a;
    if (!process.env.VERBOSE) {
        return console.error(messages);
    }
    console.error((_a = getStyledTextForLogging('red')) === null || _a === void 0 ? void 0 : _a('error'), ...messages);
}
exports.error = error;
function log(style, title, ...messages) {
    var _a, _b;
    if (!process.env.VERBOSE) {
        return;
    }
    let lastMessage = null;
    if (messages.length > 1 && typeof messages[messages.length - 1] !== 'string') {
        lastMessage = messages.splice(messages.length - 1, 1);
    }
    console.info((_a = color()) === null || _a === void 0 ? void 0 : _a.whiteBright.bgCyan('debug'), (_b = getStyledTextForLogging(style)) === null || _b === void 0 ? void 0 : _b(title), ...messages);
    if (lastMessage) {
        console.dir(lastMessage, { depth: 6, maxArrayLength: 6 });
    }
}
exports.log = log;
function getStyledTextForLogging(style) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!process.env.VERBOSE) {
        return;
    }
    switch (style) {
        case 'blue':
            return (_a = color()) === null || _a === void 0 ? void 0 : _a.whiteBright.bgBlue;
        case 'cyan':
            return (_b = color()) === null || _b === void 0 ? void 0 : _b.whiteBright.bgCyan;
        case 'green':
            return (_c = color()) === null || _c === void 0 ? void 0 : _c.whiteBright.bgGreen;
        case 'magenta':
            return (_d = color()) === null || _d === void 0 ? void 0 : _d.whiteBright.bgMagenta;
        case 'red':
            return (_e = color()) === null || _e === void 0 ? void 0 : _e.whiteBright.bgRedBright;
        case 'white':
            return (_f = color()) === null || _f === void 0 ? void 0 : _f.black.bgWhite;
        case 'yellow':
            return (_g = color()) === null || _g === void 0 ? void 0 : _g.whiteBright.bgYellow;
    }
}
/**
 * escape block comments in schema descriptions so that they don't unexpectedly close JSDoc comments in generated typescript interfaces
 */
function escapeBlockComment(schema) {
    const replacer = '* /';
    if (schema === null || typeof schema !== 'object') {
        return;
    }
    for (const key of Object.keys(schema)) {
        if (key === 'description' && typeof schema[key] === 'string') {
            schema[key] = schema[key].replace(/\*\//g, replacer);
        }
    }
}
exports.escapeBlockComment = escapeBlockComment;
/*
the following logic determines the out path by comparing the in path to the users specified out path.
For example, if input directory MultiSchema looks like:
  MultiSchema/foo/a.json
  MultiSchema/bar/fuzz/c.json
  MultiSchema/bar/d.json
And the user wants the outputs to be in MultiSchema/Out, then this code will be able to map the inner directories foo, bar, and fuzz into the intended Out directory like so:
  MultiSchema/Out/foo/a.json
  MultiSchema/Out/bar/fuzz/c.json
  MultiSchema/Out/bar/d.json
*/
function pathTransform(outputPath, inputPath, filePath) {
    const inPathList = (0, path_1.normalize)(inputPath).split(path_1.sep);
    const filePathList = (0, path_1.dirname)((0, path_1.normalize)(filePath)).split(path_1.sep);
    const filePathRel = filePathList.filter((f, i) => f !== inPathList[i]);
    return path_1.posix.join(path_1.posix.normalize(outputPath), ...filePathRel);
}
exports.pathTransform = pathTransform;
/**
 * Removes the schema's `default` property if it doesn't match the schema's `type` property.
 * Useful when parsing unions.
 *
 * Mutates `schema`.
 */
function maybeStripDefault(schema) {
    if (!('default' in schema)) {
        return schema;
    }
    switch (schema.type) {
        case 'array':
            if (Array.isArray(schema.default)) {
                return schema;
            }
            break;
        case 'boolean':
            if (typeof schema.default === 'boolean') {
                return schema;
            }
            break;
        case 'integer':
        case 'number':
            if (typeof schema.default === 'number') {
                return schema;
            }
            break;
        case 'string':
            if (typeof schema.default === 'string') {
                return schema;
            }
            break;
        case 'null':
            if (schema.default === null) {
                return schema;
            }
            break;
        case 'object':
            if ((0, lodash_1.isPlainObject)(schema.default)) {
                return schema;
            }
            break;
    }
    delete schema.default;
    return schema;
}
exports.maybeStripDefault = maybeStripDefault;
function appendToDescription(existingDescription, ...values) {
    if (existingDescription) {
        return `${existingDescription}\n\n${values.join('\n')}`;
    }
    return values.join('\n');
}
exports.appendToDescription = appendToDescription;
function isSchemaLike(schema) {
    if (!(0, lodash_1.isPlainObject)(schema)) {
        return false;
    }
    // top-level schema
    const parent = schema[JSONSchema_1.Parent];
    if (parent === null) {
        return true;
    }
    const JSON_SCHEMA_KEYWORDS = [
        '$defs',
        'allOf',
        'anyOf',
        'definitions',
        'dependencies',
        'enum',
        'not',
        'oneOf',
        'patternProperties',
        'properties',
        'required',
    ];
    if (JSON_SCHEMA_KEYWORDS.some(_ => parent[_] === schema)) {
        return false;
    }
    return true;
}
exports.isSchemaLike = isSchemaLike;
function parseFileAsJSONSchema(filename, contents) {
    if (filename != null && isYaml(filename)) {
        return Try(() => js_yaml_1.default.load(contents.toString()), () => {
            throw new TypeError(`Error parsing YML in file "${filename}"`);
        });
    }
    return Try(() => JSON.parse(contents.toString()), () => {
        throw new TypeError(`Error parsing JSON in file "${filename}"`);
    });
}
exports.parseFileAsJSONSchema = parseFileAsJSONSchema;
function isYaml(filename) {
    return filename.endsWith('.yaml') || filename.endsWith('.yml');
}
function color() {
    let cliColor;
    try {
        cliColor = require('cli-color');
    }
    catch (_a) { }
    return cliColor;
}
//# sourceMappingURL=utils.js.map