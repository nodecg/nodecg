import { SessionData, Store } from "express-session";
import { getConnection, tables } from '../database';
import { eq } from "drizzle-orm";

export default class DrizzleStore extends Store {
	override get(sid: string, callback: (err: any, session?: SessionData | null | undefined) => void): void {
		const database = getConnection();

		database.query.session.findFirst({
			where: eq(tables.session.id, sid)
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
		const database = getConnection();
		const stringifiedSessionData = JSON.stringify(sessionData)

		database.insert(tables.session)
			.values({
				id: sid,
				json: stringifiedSessionData
			})
			.onConflictDoUpdate({
				target: [tables.session.id],
				set: {
					json: stringifiedSessionData
				}
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
		const database = getConnection();
		database.delete(tables.session)
			.where(eq(tables.session.id, sid))
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
