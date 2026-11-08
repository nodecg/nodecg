export const reportReady = () => {
	process.send?.({ type: "ready" });
};
