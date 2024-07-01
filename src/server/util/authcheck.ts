// Packages
import type express from 'express';

// Ours
import { getConnection, apiKey, identity } from '../database';
import { isSuperUser, findUser, createApiKeyForUserWithId } from '../database/utils';
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
			const database = await getConnection();
			const foundApiKey = await database.query.apiKey.findFirst({
				where: eq(apiKey.secret_key, req.query['key'] ?? req.cookies.socketToken)
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

			user = (await findUser(foundApiKey.userId)) ?? undefined;
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

		const database = await getConnection()
		const foundIdentity = await database
			.query
			.identity
			.findFirst({
				where: eq(identity.userId, user.id)
			});

		if (foundIdentity) {
			const provider = foundIdentity.provider_type;
			const providerAllowed = config.login?.[provider]?.enabled;
			if ((keyOrSocketTokenAuthenticated || req.isAuthenticated()) && allowed && providerAllowed) {
				let foundApiKey = await database.query.apiKey.findFirst({
					where: eq(apiKey.userId, user.id)
				});

				// This should only happen if the database is manually edited, say, in the event of a security breach
				// that reavealed an API key that needed to be deleted.
				if (!foundApiKey) {
					// Make a new api key.
					foundApiKey = await createApiKeyForUserWithId(user.id);
				}

				if (!foundApiKey) {
					throw new Error('Expected to have a created API key');
				}

				// Set the cookie so that requests to other resources on the page
				// can also be authenticated.
				// This is crucial for things like OBS browser sources,
				// where we don't have a session.
				res.cookie('socketToken', foundApiKey.secret_key, {
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
