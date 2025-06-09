import type { UnAuthErrCode } from "../../types/socket-protocol";
export declare class UnauthorizedError extends Error {
    serialized: {
        message: string;
        code: UnAuthErrCode;
        type: "UnauthorizedError";
    };
    constructor(code: UnAuthErrCode, message: string);
}
