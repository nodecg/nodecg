"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeLevelColumn = TreeLevelColumn;
const globals_1 = require("../../globals");
/**
 * Creates a "level"/"length" column to the table that holds a closure table.
 */
function TreeLevelColumn() {
    return function (object, propertyName) {
        (0, globals_1.getMetadataArgsStorage)().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "treeLevel",
            options: {},
        });
    };
}

//# sourceMappingURL=TreeLevelColumn.js.map
