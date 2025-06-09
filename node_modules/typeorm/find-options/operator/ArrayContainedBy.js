"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayContainedBy = ArrayContainedBy;
const FindOperator_1 = require("../FindOperator");
/**
 * FindOptions Operator.
 * Example: { someField: ArrayContainedBy([...]) }
 */
function ArrayContainedBy(value) {
    return new FindOperator_1.FindOperator("arrayContainedBy", value);
}

//# sourceMappingURL=ArrayContainedBy.js.map
