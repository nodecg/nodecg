import type { ExtendedError } from 'socket.io/dist/namespace';
import { getConnection, tables } from '../database';
import { createApiKeyForUserWithId, isUserIdSuperUser } from '../database/utils';
import { config } from '../config';
import UnauthorizedError from '../login/UnauthorizedError';
import type { TypedServerSocket } from '../../types/socket-protocol';
import { UnAuthErrCode } from '../../types/socket-protocol';
import createLogger from '../logger';
import { serializeError } from 'serialize-error';
import { and, eq, isNotNull } from 'drizzle-orm';

const log = createLogger('socket-auth');
const socketsByKey = new Map<string, Set<TypedServerSocket>>();

export default async function (socket: TypedServerSocket, next: (err?: ExtendedError) => void): Promise<void> {
	try {
		const { token } = socket.handshake.query;
		if (!token) {
			next(new UnauthorizedError(UnAuthErrCode.InvalidToken, 'no token provided'));
			return;
		}

		if (Array.isArray(token)) {
			next(new UnauthorizedError(UnAuthErrCode.InvalidToken, 'more than one token provided'));
			return;
		}

		const database = await getConnection();
		const result = (await database.select()
			.from(tables.apiKey)
			.where(
				and(
					eq(tables.apiKey.secret_key, token),
					isNotNull(tables.apiKey.userId)
				)
			)
			.leftJoin(tables.identity, eq(tables.apiKey.userId, tables.identity.userId))
			.limit(1))[0];

		if (!result) {
			next(new UnauthorizedError(UnAuthErrCode.CredentialsRequired, 'no credentials found'));
			return;
		}

		const foundIdentity = result.identity
		if (!foundIdentity) {
			next(new UnauthorizedError(UnAuthErrCode.CredentialsRequired, 'no user associated with provided credentials'));
			return;
		}

		// But only authed sockets can join the Authed room.
		const provider = foundIdentity.provider_type;
		const providerAllowed = config.login.enabled && config.login?.[provider]?.enabled;
		const allowed = await isUserIdSuperUser(foundIdentity.userId!) && providerAllowed;

		if (allowed) {
			if (!socketsByKey.has(token)) {
				socketsByKey.set(token, new Set<TypedServerSocket>());
			}

			const socketSet = socketsByKey.get(token);
			/* istanbul ignore next: should be impossible */
			if (!socketSet) {
				throw new Error('socketSet was somehow falsey');
			}

			socketSet.add(socket);

			socket.on('regenerateToken', async (cb) => {
				try {
					// Delete the key for the token we want to revoke
					const deletedKey = (await database.delete(tables.apiKey)
						.where(eq(tables.apiKey.secret_key, token))
						.returning())[0];

					if (!deletedKey) {
						// Something is weird if we're here, cause we didn't delete an API key, so just close the socket.
						if (cb) {
							cb(undefined, undefined);
						}

						socket.disconnect(true);
					} else {
						// Find the user that
						const userId = deletedKey.userId;
						if (!userId) {
							throw new Error('should have been a user here');
						}

						// Make the new api key
						await createApiKeyForUserWithId(userId);

						if (cb) {
							cb(undefined, undefined);
						}
					}

					// Close all sockets that are using the invalidated key,
					// EXCEPT the one that requested the revocation.
					// If we close the one that requested the revocation,
					// there will be a race condition where it might get redirected
					// to an error page before it receives the new key.
					for (const s of socketSet) {
						if (s === socket) {
							continue;
						}

						s.emit(
							'protocol_error',
							new UnauthorizedError(UnAuthErrCode.TokenRevoked, 'This token has been invalidated').serialized,
						);

						// We need to wait a bit before disconnecting the socket,
						// because we need to give them time to receive the "error"
						// message we just sent.
						setTimeout(() => {
							s.disconnect(true);
						}, 500);
					}

					socketsByKey.delete(token);
				} catch (error: unknown) {
					log.error(serializeError(error));
					if (cb) {
						cb(error as string, undefined);
					}
				}
			});

			// Don't leak memory by retaining references to all sockets indefinitely
			socket.on('disconnect', () => {
				socketSet.delete(socket);
			});
		}

		if (allowed) {
			next(undefined);
		} else {
			next(new UnauthorizedError(UnAuthErrCode.InvalidToken, 'user is not allowed'));
		}
	} catch (error: unknown) {
		next(error as any);
	}
}
