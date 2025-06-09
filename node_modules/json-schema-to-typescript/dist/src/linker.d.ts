import { JSONSchema, LinkedJSONSchema } from './types/JSONSchema';
import { JSONSchema4Type } from 'json-schema';
/**
 * Traverses over the schema, giving each node a reference to its
 * parent node. We need this for downstream operations.
 */
export declare function link(schema: JSONSchema4Type | JSONSchema, parent?: JSONSchema4Type | null): LinkedJSONSchema;
