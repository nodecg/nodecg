import { useEffect } from "react";

export function useSocketEvent<T extends (...args: any[]) => void>(
	event: Parameters<typeof window.socket.on>[0],
	callback: T,
	deps: any[] = [],
) {
	useEffect(() => {
		window.socket.on(event, callback);

		return () => {
			window.socket.off(event, callback);
		};
	}, [event, callback, ...deps]);
}

export function useSocketIOEvent<T extends (...args: any[]) => void>(
	event: Parameters<typeof window.socket.io.on>[0],
	callback: T,
	deps: any[] = [],
) {
	useEffect(() => {
		window.socket.io.on(event, callback);

		return () => {
			window.socket.io.off(event, callback);
		};
	}, [event, callback, ...deps]);
}
