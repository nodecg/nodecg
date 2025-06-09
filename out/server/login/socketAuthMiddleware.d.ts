import type { DatabaseAdapter } from "@nodecg/database-adapter-types";
import type { ExtendedError } from "socket.io/dist/namespace";
import type { TypedServerSocket } from "../../types/socket-protocol";
export declare const createSocketAuthMiddleware: (db: DatabaseAdapter) => (socket: TypedServerSocket, next: (err?: ExtendedError) => void) => Promise<void>;
