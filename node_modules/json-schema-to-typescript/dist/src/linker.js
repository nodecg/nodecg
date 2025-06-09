"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.link = void 0;
const JSONSchema_1 = require("./types/JSONSchema");
const lodash_1 = require("lodash");
/**
 * Traverses over the schema, giving each node a reference to its
 * parent node. We need this for downstream operations.
 */
function link(schema, parent = null) {
    if (!Array.isArray(schema) && !(0, lodash_1.isPlainObject)(schema)) {
        return schema;
    }
    // Handle cycles
    if (schema.hasOwnProperty(JSONSchema_1.Parent)) {
        return schema;
    }
    // Add a reference to this schema's parent
    Object.defineProperty(schema, JSONSchema_1.Parent, {
        enumerable: false,
        value: parent,
        writable: false,
    });
    // Arrays
    if (Array.isArray(schema)) {
        schema.forEach(child => link(child, schema));
    }
    // Objects
    for (const key in schema) {
        link(schema[key], schema);
    }
    return schema;
}
exports.link = link;
//# sourceMappingURL=linker.js.map