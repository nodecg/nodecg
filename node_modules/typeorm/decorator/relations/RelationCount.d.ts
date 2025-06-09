import { SelectQueryBuilder } from "../../query-builder/SelectQueryBuilder";
/**
 * Holds a number of children in the closure table of the column.
 *
 * @deprecated This decorator will removed in the future versions.
 * Use {@link VirtualColumn} to calculate the count instead.
 */
export declare function RelationCount<T>(relation: string | ((object: T) => any), alias?: string, queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): PropertyDecorator;
