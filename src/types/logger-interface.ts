export type LoggerInterface = {
	name: string;
	trace: (...args: any[]) => void;
	debug: (...args: any[]) => void;
	info: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	error: (...args: any[]) => void;
	replicants: (...args: any[]) => void;
};

export const LogLevels = ['verbose', 'debug', 'info', 'warn', 'error', 'silent'] as const;

export const LogLevel = {
	Trace: 'verbose',
	Debug: 'debug',
	Info: 'info',
	Warn: 'warn',
	Error: 'error',
	Silent: 'silent',
} satisfies Record<string, (typeof LogLevels)[number]>;

export type LogLevel = (typeof LogLevels)[number];
