"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationCount = RelationCount;
const globals_1 = require("../../globals");
/**
 * Holds a number of children in the closure table of the column.
 *
 * @deprecated This decorator will removed in the future versions.
 * Use {@link VirtualColumn} to calculate the count instead.
 */
function RelationCount(relation, alias, queryBuilderFactory) {
    return function (object, propertyName) {
        (0, globals_1.getMetadataArgsStorage)().relationCounts.push({
            target: object.constructor,
            propertyName: propertyName,
            relation: relation,
            alias: alias,
            queryBuilderFactory: queryBuilderFactory,
        });
    };
}

//# sourceMappingURL=RelationCount.js.map
