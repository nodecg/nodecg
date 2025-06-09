import type { ExtendedError } from "socket.io/dist/namespace";
import type { TypedServerSocket } from "../../types/socket-protocol";
export declare function socketApiMiddleware(socket: TypedServerSocket, next: (err?: ExtendedError) => void): void;
