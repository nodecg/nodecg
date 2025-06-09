"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySchemaTyping = void 0;
const JSONSchema_1 = require("./types/JSONSchema");
const typesOfSchema_1 = require("./typesOfSchema");
function applySchemaTyping(schema) {
    var _a;
    const types = (0, typesOfSchema_1.typesOfSchema)(schema);
    Object.defineProperty(schema, JSONSchema_1.Types, {
        enumerable: false,
        value: types,
        writable: false,
    });
    if (types.size === 1) {
        return;
    }
    // Some schemas can be understood as multiple possible types (see related
    // comment in `typesOfSchema.ts`). In such cases, we generate an `ALL_OF`
    // intersection that will ultimately be used to generate a union type.
    //
    // The original schema's name, title, and description are hoisted to the
    // new intersection schema to prevent duplication.
    //
    // If the original schema also contained its own `ALL_OF` property, it is
    // also hoiested to the new intersection schema.
    const intersection = {
        [JSONSchema_1.Parent]: schema,
        [JSONSchema_1.Types]: new Set(['ALL_OF']),
        $id: schema.$id,
        description: schema.description,
        name: schema.name,
        title: schema.title,
        allOf: (_a = schema.allOf) !== null && _a !== void 0 ? _a : [],
        required: [],
        additionalProperties: false,
    };
    types.delete('ALL_OF');
    delete schema.allOf;
    delete schema.$id;
    delete schema.description;
    delete schema.name;
    delete schema.title;
    Object.defineProperty(schema, JSONSchema_1.Intersection, {
        enumerable: false,
        value: intersection,
        writable: false,
    });
}
exports.applySchemaTyping = applySchemaTyping;
//# sourceMappingURL=applySchemaTyping.js.map