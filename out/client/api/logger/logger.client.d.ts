import type * as Sentry from "@sentry/browser";
import { LogLevel } from "../../../types/logger-interface";
interface LoggerOptions {
    console: {
        enabled: boolean;
        level?: LogLevel;
        replicants?: boolean;
    };
}
/**
 * A factory that configures and returns a Logger constructor.
 *
 * @returns  A constructor used to create discrete logger instances.
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
    _shouldLogReplicants: boolean;
    _silent: boolean;
    _level: LogLevel;
};
export {};
