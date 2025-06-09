import { JSONSchema, SchemaType } from './types/JSONSchema';
/**
 * Duck types a JSONSchema schema or property to determine which kind of AST node to parse it into.
 *
 * Due to what some might say is an oversight in the JSON-Schema spec, a given schema may
 * implicitly be an *intersection* of multiple JSON-Schema directives (ie. multiple TypeScript
 * types). The spec leaves it up to implementations to decide what to do with this
 * loosely-defined behavior.
 */
export declare function typesOfSchema(schema: JSONSchema): Set<SchemaType>;
