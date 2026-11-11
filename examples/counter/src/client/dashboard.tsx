import { derive } from "@nodecg/client";
import { StrictMode, Suspense, useState } from "react";

import { Login } from "./login.tsx";
import { counter, mount, root, useField, useTopic } from "./store.tsx";

const nextCount = derive(
	(get) => get(counter.replicant.count) + get(root.replicant.step),
);

const parityIcon = derive((get) =>
	get(root.computed.parity) === "even" ? "🟢" : "🔴",
);

const countBucket = derive(
	(get) => {
		const value = get(counter.replicant.count);
		return { label: value < 0 ? "negative" : value < 10 ? "low" : "high" };
	},
	{ equals: (a, b) => a.label === b.label },
);

function Dashboard() {
	const count = useField(counter.replicant.count);
	const step = useField(root.replicant.step);
	const parity = useField(root.computed.parity);
	const announcement = useField(root.computed.announcement);
	const next = useField(nextCount);
	const icon = useField(parityIcon);
	const bucket = useField(countBucket);
	const cheers = useTopic(counter.topic.cheer);
	const [message, setMessage] = useState("");
	const [lastRoll, setLastRoll] = useState<number | undefined>(undefined);
	return (
		<div>
			<h1>Counter dashboard</h1>
			<p>
				count = {count} ({parity}) {icon}
			</p>
			<p>{announcement}</p>
			<p>bucket = {bucket.label}</p>
			<p>step = {step}</p>
			<p>next click → {next}</p>
			<p>last roll (rpc reply) = {lastRoll ?? "—"}</p>
			<button
				type="button"
				onClick={() => counter.replicant.count.update((value) => value + step)}
			>
				+{step}
			</button>
			<button
				type="button"
				onClick={() => root.replicant.step.update((value) => value + 1)}
			>
				step +1
			</button>
			<button
				type="button"
				onClick={async () => {
					setLastRoll(await counter.rpc.roll.call(6));
				}}
			>
				roll a die (rpc)
			</button>
			<h2>Cheer (topic)</h2>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					if (message !== "") {
						void counter.topic.cheer.publish(message);
						setMessage("");
					}
				}}
			>
				<input
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					placeholder="Send a cheer"
				/>
				<button type="submit">cheer</button>
			</form>
			<ul>
				{cheers.map((cheer, index) => (
					<li key={index}>{cheer}</li>
				))}
			</ul>
		</div>
	);
}

mount(
	<StrictMode>
		<Login />
		<Suspense fallback="Loading...">
			<Dashboard />
		</Suspense>
	</StrictMode>,
);
