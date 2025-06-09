import { getMetadataArgsStorage } from "../../globals";
/**
 * Holds a number of children in the closure table of the column.
 *
 * @deprecated This decorator will removed in the future versions.
 * Use {@link VirtualColumn} to calculate the count instead.
 */
export function RelationCount(relation, alias, queryBuilderFactory) {
    return function (object, propertyName) {
        getMetadataArgsStorage().relationCounts.push({
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory,
        });
    };
}

//# sourceMappingURL=RelationCount.js.map
