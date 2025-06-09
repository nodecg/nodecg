"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyError = stringifyError;
exports.stringifyErrorInner = stringifyErrorInner;
/**
 * Make a string out of an error (or other equivalents),
 * including any additional data such as stack trace if available.
 * Safe to use on unknown inputs.
 */
function stringifyError(error, noStack = false) {
    const o = stringifyErrorInner(error);
    if (noStack || !o.stack) {
        return o.message;
    }
    return `${o.message}, ${o.stack}`;
}
function stringifyErrorInner(error) {
    let message;
    let stack;
    if (typeof error === "string") {
        message = error;
    }
    else if (error === null) {
        message = "null";
    }
    else if (error === undefined) {
        message = "undefined";
    }
    else if (error && typeof error === "object") {
        if (typeof error.error === "object" &&
            error.error.message) {
            message = error.error.message;
            stack = error.error.stack;
        }
        else if (error.reason) {
            if (error.reason.message) {
                message = error.reason.message;
                stack = error.reason.stack || error.reason.reason;
            }
            else {
                // Is a Meteor.Error
                message = error.reason;
                stack = error.stack;
            }
        }
        else if (error.message) {
            // Is an Error
            message = error.message;
            stack = error.stack;
        }
        else if (error.details) {
            message = error.details;
        }
        else {
            try {
                // Try to stringify the object:
                message = JSON.stringify(error);
            }
            catch (e) {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
                message = `${error} (stringifyError: ${e})`;
            }
        }
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
        message = `${error}`;
    }
    message = `${message}`;
    return {
        message,
        stack,
    };
}
//# sourceMappingURL=errors.js.map