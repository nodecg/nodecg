import Cookies from "cookies-js";
import io from "socket.io-client";

import type { TypedClientSocket } from "../types/socket-protocol";

const params = new URLSearchParams(location.search);
globalThis.token = params.get("key") ?? Cookies.get("socketToken");
if (globalThis.token) {
	globalThis.socket = io(undefined, {
		query: { token: globalThis.token },
	}) as TypedClientSocket;
} else {
	globalThis.socket = io() as TypedClientSocket;
}

globalThis.socket.on("disconnect", (reason) => {
	if (reason === "io server disconnect") {
		globalThis.socket.connect();
	} else {
		console.log("Socket disconnect reason:", reason);
	}
});
