"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsNull = IsNull;
const FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Example: { someField: IsNull() }
 */
function IsNull() {
    return new FindOperator_1.FindOperator("isNull", undefined, false);
}

//# sourceMappingURL=IsNull.js.map
