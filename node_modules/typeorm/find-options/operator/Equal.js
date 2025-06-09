"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Equal = Equal;
const EqualOperator_1 = require("../EqualOperator");
/**
 * Find Options Operator.
 * This operator is handy to provide object value for non-relational properties of the Entity.
 *
 * Examples:
 *      { someField: Equal("value") }
 *      { uuid: Equal(new UUID()) }
 */
function Equal(value) {
    return new EqualOperator_1.EqualOperator(value);
}

//# sourceMappingURL=Equal.js.map
