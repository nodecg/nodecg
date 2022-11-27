// Packages
import type express from 'express';

// Ours
import { getConnection, ApiKey } from '../database';
import { isSuperUser, findUser } from '../database/utils';
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

		// To set a cookie on localhost, domain must be left blank
		let domain: string | undefined = config.baseURL.replace(/:[0-9]+/, '');
		if (domain === 'localhost') {
			domain = undefined;
		}

		let { user } = req;
		if (req.query.key ?? req.cookies.socketToken) {
			const database = await getConnection();
			const apiKey = await database.getRepository(ApiKey).findOne({
				where: { secret_key: req.query.key ?? req.cookies.socketToken },
				relations: ['user'],
			});

			// No record of this API Key found, reject the request.
			if (!apiKey) {
				// Ensure we delete the existing cookie so that it doesn't become poisoned
				// and cause an infinite login loop.
				req.session?.destroy(() => {
					res.clearCookie('socketToken', {
						path: '/',
						domain,
						secure: config.ssl?.enabled,
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
		const provider = user.identities[0]?.provider_type;
		const providerAllowed = config.login?.[provider]?.enabled;
		if (req.isAuthenticated() && allowed && providerAllowed) {
			let apiKey = user.apiKeys[0];

			// This should only happen if the database is manually edited, say, in the event of a security breach
			// that reavealed an API key that needed to be deleted.
			if (!apiKey) {
				// Make a new api key.
				const database = await getConnection();
				apiKey = database.manager.create(ApiKey);
				await database.manager.save(apiKey);

				// Assign this key to the user.
				user.apiKeys.push(apiKey);
				await database.manager.save(user);
			}

			// Set the cookie so that requests to other resources on the page
			// can also be authenticated.
			// This is crucial for things like OBS browser sources,
			// where we don't have a session.
			res.cookie('socketToken', apiKey.secret_key, {
				path: '/',
				domain: domain!,
				secure: config.ssl?.enabled,
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
