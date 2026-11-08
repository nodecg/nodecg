import { loadNamespace } from "@nodecg/client";
import { StrictMode, useState } from "react";

import { showManifest } from "../shared/manifest.ts";
import { render } from "./store.tsx";

const ticker = await loadNamespace(showManifest.children.ticker);

function Dashboard() {
	const [message, setMessage] = useState("");
	return (
		<>
			<h1>Nested namespaces dashboard</h1>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					if (message !== "") {
						setMessage("");
						void ticker.rpc.post.call(message);
					}
				}}
			>
				<input
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					placeholder="Ticker message"
				/>
				<button type="submit">Post</button>
			</form>
		</>
	);
}

render(
	<StrictMode>
		<Dashboard />
	</StrictMode>,
);
