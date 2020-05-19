export interface LoggerInterface {
	name: string;
	trace: (...args: any[]) => void;
	debug: (...args: any[]) => void;
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
	replicants: (...args: any[]) => void;
}

export enum LogLevel {
	Trace = 'verbose',
	Debug = 'debug',
	Info = 'info',
	Warn = 'warn',
	Error = 'error',
	Silent = 'silent',
}
