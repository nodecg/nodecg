// Packages
import type express from 'express';

// Ours
import { getConnection, tables } from '../database';
import { isSuperUser, createApiKeyForUserWithId } from '../database/utils';
import { config } from '../config';
import { eq } from 'drizzle-orm';

/**
 * Express middleware that checks if the user is authenticated.
 */
export default async function (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
	try {
		if (!config.login?.enabled) {
			next();
			return;
		}

		let { user } = req;
		let isUsingKeyOrSocketToken = false;
		let keyOrSocketTokenAuthenticated = false;
		if (req.query['key'] ?? req.cookies.socketToken) {
			isUsingKeyOrSocketToken = true;
			const database = getConnection();
			const foundApiKey = await database.query.apiKey.findFirst({
				where: eq(tables.apiKey.secret_key, req.query['key'] ?? req.cookies.socketToken),
				with: {
					user: true
				}
			});

			// No record of this API Key found, reject the request.
			if (!foundApiKey) {
				// Ensure we delete the existing cookie so that it doesn't become poisoned
				// and cause an infinite login loop.
				req.session?.destroy(() => {
					res.clearCookie('socketToken', {
						secure: req.secure,
						sameSite: req.secure ? 'none' : undefined,
					});
					res.clearCookie('connect.sid', { path: '/' });
					res.clearCookie('io', { path: '/' });

					res.redirect('/login');
				});
				return;
			}

			user = foundApiKey.user ?? undefined;
		}

		if (!user) {
			if (req.session) {
				req.session.returnTo = req.url;
			}

			res.status(403).redirect('/login');
			return;
		}

		const allowed = await isSuperUser(user);
		keyOrSocketTokenAuthenticated = isUsingKeyOrSocketToken && allowed;

		const database = getConnection()
		const result = (await database.select()
			.from(tables.identity)
			.where(eq(tables.identity.userId, user.id))
			.leftJoin(tables.apiKey, eq(tables.identity.userId, tables.apiKey.userId))
			.limit(1))[0];

		if (result) {
			const provider = result.identity.provider_type;
			const providerAllowed = config.login?.[provider]?.enabled;
			if ((keyOrSocketTokenAuthenticated || req.isAuthenticated()) && allowed && providerAllowed) {
				let token = result.api_key?.secret_key

				// This should only happen if the database is manually edited, say, in the event of a security breach
				// that reavealed an API key that needed to be deleted.
				if (!token) {
					token = (await createApiKeyForUserWithId(user.id)).secret_key
				}

				if (!token) {
					throw new Error('Expected to have a created API key');
				}

				// Set the cookie so that requests to other resources on the page
				// can also be authenticated.
				// This is crucial for things like OBS browser sources,
				// where we don't have a session.
				res.cookie('socketToken', token, {
					secure: req.secure,
					sameSite: req.secure ? 'none' : undefined,
				});

				next();
				return;
			}
		}

		if (req.session) {
			req.session.returnTo = req.url;
		}

		res.status(403).redirect('/login');
		return;
	} catch (error: unknown) {
		next(error);
	}
}
