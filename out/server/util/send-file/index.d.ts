import type express from "express";
export declare function sendFile(directoryToPreventTraversalOutOf: string, fileLocation: string, res: express.Response, next: express.NextFunction): void;
