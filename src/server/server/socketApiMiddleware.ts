// Packages
import * as Sentry from '@sentry/node';
import type { ExtendedError } from 'socket.io/dist/namespace';

// Ours
import createLogger from '../logger';
import type { TypedServerSocket } from '../../types/socket-protocol';

const log = createLogger('nodecg/lib/server');

export default async function (socket: TypedServerSocket, next: (err?: ExtendedError) => void): Promise<void> {
	try {
		log.trace('New socket connection: ID %s with IP %s', socket.id, (socket as any).handshake.address);

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

			(socket as any).broadcast.emit('message', data);
		});

		socket.on('joinRoom', (room, cb) => {
			if (typeof room !== 'string') {
				return cb('Room must be a string');
			}

			if (!Object.keys((socket as any).rooms).includes(room)) {
				log.trace('Socket %s joined room:', socket.id, room);
				socket.join(room);
			}

			cb(null);
		});

		next();
	} catch (error: unknown) {
		next(error as any);
	}
}
