// Packages
import * as Sentry from '@sentry/node';
import type { ExtendedError } from 'socket.io/dist/namespace';

// Ours
import createLogger from '../logger';
import type { TypedServerSocket } from '../../types/socket-protocol';

const log = createLogger('socket-api');

export default function (socket: TypedServerSocket, next: (err?: ExtendedError) => void) {
	try {
		log.trace('New socket connection: ID %s with IP %s', socket.id, socket.handshake.address);

		socket.on('error', (err) => {
			if (global.sentryEnabled) {
				Sentry.captureException(err);
			}

			log.error(err);
		});

		socket.on('message', (data) => {
			log.trace(
				'Received message %s (sent to bundle %s) with data:',
				data.messageName,
				data.bundleName,
				data.content,
			);

			socket.broadcast.emit('message', data);
		});

		socket.on('joinRoom', async (room, cb) => {
			if (typeof room !== 'string') {
				cb('Room must be a string', undefined);
				return;
			}

			if (!Object.keys(socket.rooms).includes(room)) {
				log.trace('Socket %s joined room:', socket.id, room);
				await socket.join(room);
			}

			cb(undefined, undefined);
		});

		next();
	} catch (error: unknown) {
		next(error as any);
	}
}
