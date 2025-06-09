import type { LoggerInterface } from "../../types/logger-interface";
export declare let Logger: new (name: string) => LoggerInterface;
export declare function createLogger(name: string): LoggerInterface;
