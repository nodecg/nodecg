"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoreThanOrEqual = MoreThanOrEqual;
const FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Example: { someField: MoreThanOrEqual(10) }
 */
function MoreThanOrEqual(value) {
    return new FindOperator_1.FindOperator("moreThanOrEqual", value);
}

//# sourceMappingURL=MoreThanOrEqual.js.map
