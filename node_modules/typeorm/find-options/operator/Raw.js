"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Raw = Raw;
const FindOperator_1 = require("../FindOperator");
function Raw(valueOrSqlGenerator, sqlGeneratorParameters) {
    if (typeof valueOrSqlGenerator !== "function") {
        return new FindOperator_1.FindOperator("raw", valueOrSqlGenerator, false);
    }
    return new FindOperator_1.FindOperator("raw", [], true, true, valueOrSqlGenerator, sqlGeneratorParameters);
}

//# sourceMappingURL=Raw.js.map
