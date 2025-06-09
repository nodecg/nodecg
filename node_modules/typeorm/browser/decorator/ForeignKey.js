import { getMetadataArgsStorage } from "../globals";
import { ObjectUtils } from "../util/ObjectUtils";
/**
 * Creates a database foreign key. Can be used on entity property or on entity.
 * Can create foreign key with composite columns when used on entity.
 * Warning! Don't use this with relations; relation decorators create foreign keys automatically.
 */
export function ForeignKey(typeFunctionOrTarget, inverseSideOrColumnNamesOrOptions, referencedColumnNamesOrOptions, maybeOptions) {
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
    const options = ObjectUtils.isObject(inverseSideOrColumnNamesOrOptions) &&
        !Array.isArray(inverseSideOrColumnNamesOrOptions)
        ? inverseSideOrColumnNamesOrOptions
        : ObjectUtils.isObject(referencedColumnNamesOrOptions) &&
            !Array.isArray(referencedColumnNamesOrOptions)
            ? referencedColumnNamesOrOptions
            : maybeOptions;
    return function (clsOrObject, propertyName) {
        getMetadataArgsStorage().foreignKeys.push({
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
