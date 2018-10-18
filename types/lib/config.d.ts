import {LoggerOptions} from './logger';

/**
 * NodeCG config exposed in extensions and browser
 */
export interface NodeCGConfig {
	host: string;
	port: number;
	developer: boolean;
	baseURL: string;
	logging: LoggerOptions;
	sentry: {
		enabled?: boolean;
		publicDsn?: string;
	};
	login: {
		enabled?: boolean;
		local?: {
			enabled: boolean;
		};
		steam?: {
			enabled: boolean;
		};
		twitch?: {
			enabled: boolean;
			clientID: string;
			scope: string;
		};
	};
	ssl?: {
		enabled: boolean;
	};
}
