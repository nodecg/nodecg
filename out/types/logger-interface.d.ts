export interface LoggerInterface {
    name: string;
    trace: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    replicants: (...args: any[]) => void;
}
export declare const LogLevels: readonly ["verbose", "debug", "info", "warn", "error", "silent"];
export declare const LogLevel: {
    Trace: "verbose";
    Debug: "debug";
    Info: "info";
    Warn: "warn";
    Error: "error";
    Silent: "silent";
};
export type LogLevel = (typeof LogLevels)[number];
