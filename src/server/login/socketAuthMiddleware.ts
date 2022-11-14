// Packages
import type SocketIO from 'socket.io';

// Ours
import { getConnection, ApiKey } from '../database';
import { isSuperUser, findUser } from '../database/utils';
import { config } from '../config';
import UnauthorizedError from '../login/UnauthorizedError';
import type { TypedServerSocket } from '../../types/socket-protocol';
import { UnAuthErrCode } from '../../types/socket-protocol';
import createLogger from '../logger';

const log = createLogger('socket-auth');
const socketsByKey = new Map<string, Set<TypedServerSocket>>();

export default async function (socket: TypedServerSocket, next: SocketIO.NextFunction): Promise<void> {
	try {
		const req = (socket as any).request; // Not typed in the typed-socket.io lib for some reason.
		const { token } = req._query;
		const database = await getConnection();
		const apiKey = await database.getRepository(ApiKey).findOne(
			{
				secret_key: token,
			},
			{
				relations: ['user'],
			},
		);

		if (!apiKey) {
			next(new UnauthorizedError(UnAuthErrCode.CredentialsRequired, 'no credentials found'));
			return;
		}

		const user = await findUser(apiKey.user.id);
		if (!user) {
			next(
				new UnauthorizedError(
					UnAuthErrCode.CredentialsRequired,
					'no user associated with provided credentials',
				),
			);
			return;
		}

		// But only authed sockets can join the Authed room.
		const provider = user.identities[0]?.provider_type;
		const providerAllowed = config.login?.[provider]?.enabled;
		const allowed = isSuperUser(user) && providerAllowed;

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

			socket.on('regenerateToken', async (_, cb) => {
				try {
					// Lookup the ApiKey for this token we want to revoke.
					const keyToDelete = await database
						.getRepository(ApiKey)
						.findOne({ secret_key: token }, { relations: ['user'] });

					// If there's a User associated to this key (there should be)
					// give them a new ApiKey
					if (keyToDelete) {
						// Make the new api key
						const newApiKey = database.manager.create(ApiKey);
						await database.manager.save(newApiKey);

						// Remove the old key from the user, replace it with the new
						const user = await findUser(keyToDelete.user.id);
						if (!user) {
							throw new Error('should have been a user here');
						}

						user.apiKeys = user.apiKeys.filter((ak) => ak.secret_key !== token);
						user.apiKeys.push(newApiKey);
						await database.manager.save(user);

						// Delete the old key entirely
						await database.manager.delete(ApiKey, { secret_key: token });

						if (cb) {
							cb(null);
						}
					} else {
						// Something is weird if we're here, just close the socket.
						if (cb) {
							cb(null);
						}

						socket.disconnect(true);
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
							new UnauthorizedError(UnAuthErrCode.TokenRevoked, 'This token has been invalidated')
								.serialized,
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
					log.error(error);
					if (cb) {
						cb(error as string);
					}
				}
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
