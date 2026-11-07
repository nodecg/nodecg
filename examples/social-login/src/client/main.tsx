import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { Login } from "./login.tsx";

const rootElement = document.getElementById("app");
if (rootElement === null) {
	throw new Error("#app not found");
}
ReactDOM.createRoot(rootElement).render(
	<StrictMode>
		<h1>Social login example</h1>
		<Login />
	</StrictMode>,
);
