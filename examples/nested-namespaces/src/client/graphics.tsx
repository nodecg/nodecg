import { loadNamespace } from "@nodecg/client";
import { StrictMode } from "react";

import { showManifest } from "../shared/manifest.ts";
import { render, useReplicant } from "./store.tsx";

const show = await loadNamespace(showManifest);

function Graphics() {
	const title = useReplicant(show.replicant.title);
	const messages = useReplicant(show.computed.visibleMessages);
	return (
		<>
			<h1>{title}</h1>
			<pre style={{ fontSize: "2rem" }}>{messages?.join("\n")}</pre>
		</>
	);
}

render(
	<StrictMode>
		<Graphics />
	</StrictMode>,
);
