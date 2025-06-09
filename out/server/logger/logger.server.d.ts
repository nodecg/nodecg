import type * as Sentry from "@sentry/node";
import winston from "winston";
import { LogLevel } from "../../types/logger-interface";
interface LoggerOptions {
    console: Partial<{
        enabled: boolean;
        timestamps: boolean;
        level: LogLevel;
        replicants: boolean;
    }>;
    file: Partial<{
        enabled: boolean;
        timestamps: boolean;
        level: LogLevel;
        path: string;
        replicants: boolean;
    }>;
}
/**
 * A factory that configures and returns a Logger constructor.
 *
 * @returns A constructor used to create discrete logger instances.
 */
export declare function loggerFactory(initialOpts?: Partial<LoggerOptions>, sentry?: typeof Sentry | undefined): {
    new (name: string): {
        name: string;
        trace(...args: any[]): void;
        debug(...args: any[]): void;
        info(...args: any[]): void;
        warn(...args: any[]): void;
        error(...args: any[]): void;
        replicants(...args: any[]): void;
    };
    readonly _consoleLogger: winston.Logger;
    readonly _fileLogger: winston.Logger;
    _shouldConsoleLogReplicants: boolean;
    _shouldFileLogReplicants: boolean;
};
export {};
