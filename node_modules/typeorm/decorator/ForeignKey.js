"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForeignKey = ForeignKey;
const globals_1 = require("../globals");
const ObjectUtils_1 = require("../util/ObjectUtils");
/**
 * Creates a database foreign key. Can be used on entity property or on entity.
 * Can create foreign key with composite columns when used on entity.
 * Warning! Don't use this with relations; relation decorators create foreign keys automatically.
 */
function ForeignKey(typeFunctionOrTarget, inverseSideOrColumnNamesOrOptions, referencedColumnNamesOrOptions, maybeOptions) {
    const inverseSide = typeof inverseSideOrColumnNamesOrOptions === "string" ||
        typeof inverseSideOrColumnNamesOrOptions === "function"
        ? inverseSideOrColumnNamesOrOptions
        : undefined;
    const columnNames = Array.isArray(inverseSideOrColumnNamesOrOptions)
        ? inverseSideOrColumnNamesOrOptions
        : undefined;
    const referencedColumnNames = Array.isArray(referencedColumnNamesOrOptions)
        ? referencedColumnNamesOrOptions
        : undefined;
    const options = ObjectUtils_1.ObjectUtils.isObject(inverseSideOrColumnNamesOrOptions) &&
        !Array.isArray(inverseSideOrColumnNamesOrOptions)
        ? inverseSideOrColumnNamesOrOptions
        : ObjectUtils_1.ObjectUtils.isObject(referencedColumnNamesOrOptions) &&
            !Array.isArray(referencedColumnNamesOrOptions)
            ? referencedColumnNamesOrOptions
            : maybeOptions;
    return function (clsOrObject, propertyName) {
        (0, globals_1.getMetadataArgsStorage)().foreignKeys.push({
            target: propertyName
                ? clsOrObject.constructor
                : clsOrObject,
            propertyName: propertyName,
            type: typeFunctionOrTarget,
            inverseSide,
            columnNames,
            referencedColumnNames,
            ...options,
        });
    };
}

//# sourceMappingURL=ForeignKey.js.map
