"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = void 0;
class UnauthorizedError extends Error {
    serialized;
    constructor(code, message) {
        super(message);
        this.message = message;
        this.serialized = {
            message: this.message,
            code,
            type: "UnauthorizedError",
        };
    }
}
exports.UnauthorizedError = UnauthorizedError;
//# sourceMappingURL=UnauthorizedError.js.map