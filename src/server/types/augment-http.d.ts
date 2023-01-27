// https://socket.io/how-to/use-with-express-session#with-typescript
import { type SessionData, type Session } from 'express-session';

declare module 'http' {
	interface IncomingMessage extends Express.Request {
		session: Session & SessionData;
	}
}
