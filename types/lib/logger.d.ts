export class Logger {
	constructor(name: string);
	trace(...args: any[]): void;
	debug(...args: any[]): void;
	info(...args: any[]): void;
	warn(...args: any[]): void;
	error(...args: any[]): void;
	replicants(...args: any[]): void;
	static globalReconfigure(
		opts: LoggerOptions & {file: {path: string}}
	): void;
}

/**
 * Options used for Logger constructor
 */
export interface LoggerOptions {
	replicants?: boolean;
	console?: {
		enabled: boolean;
		level: LoggerLevel;
	};
	file?: {
		enabled: boolean;
		level: LoggerLevel;
	};
}

/**
 * NodeCG logger level enum
 */
export type LoggerLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
