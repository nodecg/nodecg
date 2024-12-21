import type express from 'express';
import { isSuperUser, findUser, findApiKey, createApiKey, saveUser } from '../database/default/utils';
import { config } from '../config';

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
			const apiKey = await findApiKey(req.query['key'] ?? req.cookies.socketToken);

			// No record of this API Key found, reject the request.
			if (!apiKey) {
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

			user = (await findUser(apiKey.user.id)) ?? undefined;
		}

		if (!user) {
			if (req.session) {
				req.session.returnTo = req.url;
			}

			res.status(403).redirect('/login');
			return;
		}

		const allowed = isSuperUser(user);
		keyOrSocketTokenAuthenticated = isUsingKeyOrSocketToken && allowed;
		const provider = user.identities[0]!.provider_type;
		const providerAllowed = config.login?.[provider]?.enabled;
		if ((keyOrSocketTokenAuthenticated || req.isAuthenticated()) && allowed && providerAllowed) {
			let apiKey = user.apiKeys[0];

			// This should only happen if the database is manually edited, say, in the event of a security breach
			// that reavealed an API key that needed to be deleted.
			if (!apiKey) {
				// Make a new api key.
				apiKey = await createApiKey();

				// Assign this key to the user.
				user.apiKeys.push(apiKey);
				await saveUser(user);
			}

			// Set the cookie so that requests to other resources on the page
			// can also be authenticated.
			// This is crucial for things like OBS browser sources,
			// where we don't have a session.
			res.cookie('socketToken', apiKey.secret_key, {
				secure: req.secure,
				sameSite: req.secure ? 'none' : undefined,
			});

			next();
			return;
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
