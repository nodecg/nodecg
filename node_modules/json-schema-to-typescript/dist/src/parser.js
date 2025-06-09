"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const lodash_1 = require("lodash");
const util_1 = require("util");
const applySchemaTyping_1 = require("./applySchemaTyping");
const AST_1 = require("./types/AST");
const JSONSchema_1 = require("./types/JSONSchema");
const utils_1 = require("./utils");
function parse(schema, options, keyName, processed = new Map(), usedNames = new Set()) {
    if ((0, JSONSchema_1.isPrimitive)(schema)) {
        if ((0, JSONSchema_1.isBoolean)(schema)) {
            return parseBooleanSchema(schema, keyName, options);
        }
        return parseLiteral(schema, keyName);
    }
    const intersection = schema[JSONSchema_1.Intersection];
    const types = schema[JSONSchema_1.Types];
    if (intersection) {
        const ast = parseAsTypeWithCache(intersection, 'ALL_OF', options, keyName, processed, usedNames);
        types.forEach(type => {
            ast.params.push(parseAsTypeWithCache(schema, type, options, keyName, processed, usedNames));
        });
        (0, utils_1.log)('blue', 'parser', 'Types:', [...types], 'Input:', schema, 'Output:', ast);
        return ast;
    }
    if (types.size === 1) {
        const type = [...types][0];
        const ast = parseAsTypeWithCache(schema, type, options, keyName, processed, usedNames);
        (0, utils_1.log)('blue', 'parser', 'Type:', type, 'Input:', schema, 'Output:', ast);
        return ast;
    }
    throw new ReferenceError('Expected intersection schema. Please file an issue on GitHub.');
}
exports.parse = parse;
function parseAsTypeWithCache(schema, type, options, keyName, processed = new Map(), usedNames = new Set()) {
    // If we've seen this node before, return it.
    let cachedTypeMap = processed.get(schema);
    if (!cachedTypeMap) {
        cachedTypeMap = new Map();
        processed.set(schema, cachedTypeMap);
    }
    const cachedAST = cachedTypeMap.get(type);
    if (cachedAST) {
        return cachedAST;
    }
    // Cache processed ASTs before they are actually computed, then update
    // them in place using set(). This is to avoid cycles.
    // TODO: Investigate alternative approaches (lazy-computing nodes, etc.)
    const ast = {};
    cachedTypeMap.set(type, ast);
    // Update the AST in place. This updates the `processed` cache, as well
    // as any nodes that directly reference the node.
    return Object.assign(ast, parseNonLiteral(schema, type, options, keyName, processed, usedNames));
}
function parseBooleanSchema(schema, keyName, options) {
    if (schema) {
        return {
            keyName,
            type: options.unknownAny ? 'UNKNOWN' : 'ANY',
        };
    }
    return {
        keyName,
        type: 'NEVER',
    };
}
function parseLiteral(schema, keyName) {
    return {
        keyName,
        params: schema,
        type: 'LITERAL',
    };
}
function parseNonLiteral(schema, type, options, keyName, processed, usedNames) {
    const definitions = getDefinitionsMemoized((0, JSONSchema_1.getRootSchema)(schema)); // TODO
    const keyNameFromDefinition = (0, lodash_1.findKey)(definitions, _ => _ === schema);
    switch (type) {
        case 'ALL_OF':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                params: schema.allOf.map(_ => parse(_, options, undefined, processed, usedNames)),
                type: 'INTERSECTION',
            };
        case 'ANY':
            return Object.assign(Object.assign({}, (options.unknownAny ? AST_1.T_UNKNOWN : AST_1.T_ANY)), { comment: schema.description, deprecated: schema.deprecated, keyName, standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options) });
        case 'ANY_OF':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                params: schema.anyOf.map(_ => parse(_, options, undefined, processed, usedNames)),
                type: 'UNION',
            };
        case 'BOOLEAN':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                type: 'BOOLEAN',
            };
        case 'CUSTOM_TYPE':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                params: schema.tsType,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                type: 'CUSTOM_TYPE',
            };
        case 'NAMED_ENUM':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition !== null && keyNameFromDefinition !== void 0 ? keyNameFromDefinition : keyName, usedNames, options),
                params: schema.enum.map((_, n) => ({
                    ast: parseLiteral(_, undefined),
                    keyName: schema.tsEnumNames[n],
                })),
                type: 'ENUM',
            };
        case 'NAMED_SCHEMA':
            return newInterface(schema, options, processed, usedNames, keyName);
        case 'NEVER':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                type: 'NEVER',
            };
        case 'NULL':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                type: 'NULL',
            };
        case 'NUMBER':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                type: 'NUMBER',
            };
        case 'OBJECT':
            return {
                comment: schema.description,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                type: 'OBJECT',
                deprecated: schema.deprecated,
            };
        case 'ONE_OF':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                params: schema.oneOf.map(_ => parse(_, options, undefined, processed, usedNames)),
                type: 'UNION',
            };
        case 'REFERENCE':
            throw Error((0, util_1.format)('Refs should have been resolved by the resolver!', schema));
        case 'STRING':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                type: 'STRING',
            };
        case 'TYPED_ARRAY':
            if (Array.isArray(schema.items)) {
                // normalised to not be undefined
                const minItems = schema.minItems;
                const maxItems = schema.maxItems;
                const arrayType = {
                    comment: schema.description,
                    deprecated: schema.deprecated,
                    keyName,
                    maxItems,
                    minItems,
                    standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                    params: schema.items.map(_ => parse(_, options, undefined, processed, usedNames)),
                    type: 'TUPLE',
                };
                if (schema.additionalItems === true) {
                    arrayType.spreadParam = options.unknownAny ? AST_1.T_UNKNOWN : AST_1.T_ANY;
                }
                else if (schema.additionalItems) {
                    arrayType.spreadParam = parse(schema.additionalItems, options, undefined, processed, usedNames);
                }
                return arrayType;
            }
            else {
                return {
                    comment: schema.description,
                    deprecated: schema.deprecated,
                    keyName,
                    standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                    params: parse(schema.items, options, `{keyNameFromDefinition}Items`, processed, usedNames),
                    type: 'ARRAY',
                };
            }
        case 'UNION':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                params: schema.type.map(type => {
                    const member = Object.assign(Object.assign({}, (0, lodash_1.omit)(schema, '$id', 'description', 'title')), { type });
                    (0, utils_1.maybeStripDefault)(member);
                    (0, applySchemaTyping_1.applySchemaTyping)(member);
                    return parse(member, options, undefined, processed, usedNames);
                }),
                type: 'UNION',
            };
        case 'UNNAMED_ENUM':
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                params: schema.enum.map(_ => parseLiteral(_, undefined)),
                type: 'UNION',
            };
        case 'UNNAMED_SCHEMA':
            return newInterface(schema, options, processed, usedNames, keyName, keyNameFromDefinition);
        case 'UNTYPED_ARRAY':
            // normalised to not be undefined
            const minItems = schema.minItems;
            const maxItems = typeof schema.maxItems === 'number' ? schema.maxItems : -1;
            const params = options.unknownAny ? AST_1.T_UNKNOWN : AST_1.T_ANY;
            if (minItems > 0 || maxItems >= 0) {
                return {
                    comment: schema.description,
                    deprecated: schema.deprecated,
                    keyName,
                    maxItems: schema.maxItems,
                    minItems,
                    // create a tuple of length N
                    params: Array(Math.max(maxItems, minItems) || 0).fill(params),
                    // if there is no maximum, then add a spread item to collect the rest
                    spreadParam: maxItems >= 0 ? undefined : params,
                    standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                    type: 'TUPLE',
                };
            }
            return {
                comment: schema.description,
                deprecated: schema.deprecated,
                keyName,
                params,
                standaloneName: standaloneName(schema, keyNameFromDefinition, usedNames, options),
                type: 'ARRAY',
            };
    }
}
/**
 * Compute a schema name using a series of fallbacks
 */
function standaloneName(schema, keyNameFromDefinition, usedNames, options) {
    var _a;
    const name = ((_a = options.customName) === null || _a === void 0 ? void 0 : _a.call(options, schema, keyNameFromDefinition)) || schema.title || schema.$id || keyNameFromDefinition;
    if (name) {
        return (0, utils_1.generateName)(name, usedNames);
    }
}
function newInterface(schema, options, processed, usedNames, keyName, keyNameFromDefinition) {
    const name = standaloneName(schema, keyNameFromDefinition, usedNames, options);
    return {
        comment: schema.description,
        deprecated: schema.deprecated,
        keyName,
        params: parseSchema(schema, options, processed, usedNames, name),
        standaloneName: name,
        superTypes: parseSuperTypes(schema, options, processed, usedNames),
        type: 'INTERFACE',
    };
}
function parseSuperTypes(schema, options, processed, usedNames) {
    // Type assertion needed because of dereferencing step
    // TODO: Type it upstream
    const superTypes = schema.extends;
    if (!superTypes) {
        return [];
    }
    return superTypes.map(_ => parse(_, options, undefined, processed, usedNames));
}
/**
 * Helper to parse schema properties into params on the parent schema's type
 */
function parseSchema(schema, options, processed, usedNames, parentSchemaName) {
    let asts = (0, lodash_1.map)(schema.properties, (value, key) => ({
        ast: parse(value, options, key, processed, usedNames),
        isPatternProperty: false,
        isRequired: (0, lodash_1.includes)(schema.required || [], key),
        isUnreachableDefinition: false,
        keyName: key,
    }));
    let singlePatternProperty = false;
    if (schema.patternProperties) {
        // partially support patternProperties. in the case that
        // additionalProperties is not set, and there is only a single
        // value definition, we can validate against that.
        singlePatternProperty = !schema.additionalProperties && Object.keys(schema.patternProperties).length === 1;
        asts = asts.concat((0, lodash_1.map)(schema.patternProperties, (value, key) => {
            const ast = parse(value, options, key, processed, usedNames);
            const comment = `This interface was referenced by \`${parentSchemaName}\`'s JSON-Schema definition
via the \`patternProperty\` "${key.replace('*/', '*\\/')}".`;
            ast.comment = ast.comment ? `${ast.comment}\n\n${comment}` : comment;
            return {
                ast,
                isPatternProperty: !singlePatternProperty,
                isRequired: singlePatternProperty || (0, lodash_1.includes)(schema.required || [], key),
                isUnreachableDefinition: false,
                keyName: singlePatternProperty ? '[k: string]' : key,
            };
        }));
    }
    if (options.unreachableDefinitions) {
        asts = asts.concat((0, lodash_1.map)(schema.$defs, (value, key) => {
            const ast = parse(value, options, key, processed, usedNames);
            const comment = `This interface was referenced by \`${parentSchemaName}\`'s JSON-Schema
via the \`definition\` "${key}".`;
            ast.comment = ast.comment ? `${ast.comment}\n\n${comment}` : comment;
            return {
                ast,
                isPatternProperty: false,
                isRequired: (0, lodash_1.includes)(schema.required || [], key),
                isUnreachableDefinition: true,
                keyName: key,
            };
        }));
    }
    // handle additionalProperties
    switch (schema.additionalProperties) {
        case undefined:
        case true:
            if (singlePatternProperty) {
                return asts;
            }
            return asts.concat({
                ast: options.unknownAny ? AST_1.T_UNKNOWN_ADDITIONAL_PROPERTIES : AST_1.T_ANY_ADDITIONAL_PROPERTIES,
                isPatternProperty: false,
                isRequired: true,
                isUnreachableDefinition: false,
                keyName: '[k: string]',
            });
        case false:
            return asts;
        // pass "true" as the last param because in TS, properties
        // defined via index signatures are already optional
        default:
            return asts.concat({
                ast: parse(schema.additionalProperties, options, '[k: string]', processed, usedNames),
                isPatternProperty: false,
                isRequired: true,
                isUnreachableDefinition: false,
                keyName: '[k: string]',
            });
    }
}
function getDefinitions(schema, isSchema = true, processed = new Set()) {
    if (processed.has(schema)) {
        return {};
    }
    processed.add(schema);
    if (Array.isArray(schema)) {
        return schema.reduce((prev, cur) => (Object.assign(Object.assign({}, prev), getDefinitions(cur, false, processed))), {});
    }
    if ((0, lodash_1.isPlainObject)(schema)) {
        return Object.assign(Object.assign({}, (isSchema && hasDefinitions(schema) ? schema.$defs : {})), Object.keys(schema).reduce((prev, cur) => (Object.assign(Object.assign({}, prev), getDefinitions(schema[cur], false, processed))), {}));
    }
    return {};
}
const getDefinitionsMemoized = (0, lodash_1.memoize)(getDefinitions);
/**
 * TODO: Reduce rate of false positives
 */
function hasDefinitions(schema) {
    return '$defs' in schema;
}
//# sourceMappingURL=parser.js.map