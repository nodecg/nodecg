import { StrictMode, Suspense } from "react";

import { counter, mount, useField, useTopic } from "./store.tsx";

function Graphics() {
	const count = useField(counter.replicant.count);
	const parity = useField(counter.computed.parity);
	const cheers = useTopic(counter.topic.cheer);
	const latestCheer = cheers.at(-1);
	return (
		<div style={{ fontSize: "6rem", fontFamily: "sans-serif" }}>
			{count} <small style={{ fontSize: "2rem" }}>({parity})</small>
			{typeof latestCheer !== "undefined" && (
				<div style={{ fontSize: "2rem", color: "hotpink" }}>
					Cheer: {latestCheer}
				</div>
			)}
		</div>
	);
}

mount(
	<StrictMode>
		<Suspense fallback="Loading...">
			<Graphics />
		</Suspense>
	</StrictMode>,
);
