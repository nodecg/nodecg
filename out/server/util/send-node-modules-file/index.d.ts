import type express from "express";
export declare function recursivelyFindFileInNodeModules(currentPath: string, rootNodeModulesPath: string, filePath: string): string | undefined;
export declare function sendNodeModulesFile(rootNodeModulesPath: string, basePath: string, filePath: string, res: express.Response, next: express.NextFunction): void;
