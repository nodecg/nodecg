import { loadNamespace } from "@nodecg/client";
import { useField } from "@nodecg/react";
import { StrictMode, Suspense } from "react";

import { showManifest } from "../shared/manifest.ts";
import { render } from "./store.tsx";

const show = await loadNamespace(showManifest);

function Graphics() {
	const title = useField(show.replicant.title);
	const messages = useField(show.computed.visibleMessages);
	return (
		<>
			<h1>{title}</h1>
			<pre style={{ fontSize: "2rem" }}>{messages.join("\n")}</pre>
		</>
	);
}

render(
	<StrictMode>
		<Suspense fallback="Loading...">
			<Graphics />
		</Suspense>
	</StrictMode>,
);
