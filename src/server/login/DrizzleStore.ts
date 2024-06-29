import { SessionData, Store } from "express-session";
import { getConnection, session } from '../database';
import { eq } from "drizzle-orm";

export default class DrizzleStore extends Store {
	override get(sid: string, callback: (err: any, session?: SessionData | null | undefined) => void): void {
		getConnection()
			.then(database => {
				return database.query.session.findFirst({
					where: eq(session.id, sid)
				})
			})
			.then(session => {
				if (session) {
					callback(null, JSON.parse(session.json));
				} else {
					callback(null, null);
				}
			})
			.catch(error => {
				callback(error);
			});
	}

	override set(sid: string, sessionData: SessionData, callback?: ((err?: any) => void) | undefined): void {
		getConnection()
			.then(database => {
				const stringifiedSessionData = JSON.stringify(sessionData)

				return database.insert(session)
					.values({
						id: sid,
						json: stringifiedSessionData
					})
					.onConflictDoUpdate({
						target: [session.id],
						set: {
							json: stringifiedSessionData
						}
					});
			})
			.then(() => {
				if (callback) {
					callback();
				}
			})
			.catch(error => {
				if (callback) {
					callback(error);
				}
			})
	}

	override destroy(sid: string, callback?: ((err?: any) => void) | undefined): void {
		getConnection()
			.then(database => {
				return database.delete(session)
					.where(eq(session.id, sid))
			})
			.then(() => {
				if (callback) {
					callback();
				}
			})
			.catch(error => {
				if (callback) {
					callback(error);
				}
			})
	}

}
