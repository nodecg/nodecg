import type { DatabaseAdapter } from "@nodecg/database-adapter-types";
import express from "express";
export declare function createMiddleware(db: DatabaseAdapter, callbacks: {
    onLogin(user: Express.User): void;
    onLogout(user: Express.User): void;
}): {
    app: import("express-serve-static-core").Express;
    sessionMiddleware: express.RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
};
