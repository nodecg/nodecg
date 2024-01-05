import * as Sentry from '@sentry/node';
import { config } from '../config';
import loggerFactory from './logger.server';
import type { LoggerInterface } from '../../types/logger-interface';

export let Logger: new (name: string) => LoggerInterface;
if (config.sentry?.enabled) {
	Logger = loggerFactory(config.logging, Sentry);
} else {
	Logger = loggerFactory(config.logging);
}

export default function (name: string): LoggerInterface {
	return new Logger(name);
}
