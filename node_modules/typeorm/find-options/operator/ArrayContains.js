"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayContains = ArrayContains;
const FindOperator_1 = require("../FindOperator");
/**
 * FindOptions Operator.
 * Example: { someField: ArrayContains([...]) }
 */
function ArrayContains(value) {
    return new FindOperator_1.FindOperator("arrayContains", value);
}

//# sourceMappingURL=ArrayContains.js.map
