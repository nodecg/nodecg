/**
 * Make a string out of an error (or other equivalents),
 * including any additional data such as stack trace if available.
 * Safe to use on unknown inputs.
 */
export declare function stringifyError(error: unknown, noStack?: boolean): string;
export declare function stringifyErrorInner(error: unknown): {
    message: string;
    stack: string | undefined;
};
