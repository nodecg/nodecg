/**
 * The Socket.IO typedefs leave a lot to be desired,
 * so we augment them a bit here for improved precision
 * and coverage.
 */
declare namespace SocketIO {
	/**
	 * Lange: I'm actually upset at how poorly documented this part of Socket.IO is lmao
	 */
	export type NextFunction = (err?: NodeJS.ErrnoException | null) => void;

	export type Acknowledgement = (err?: NodeJS.ErrnoException | null, data?: any) => void;
}
