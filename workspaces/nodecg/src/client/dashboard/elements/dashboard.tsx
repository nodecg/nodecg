import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import {
	createTheme,
	type MantineColorsTuple,
	MantineProvider,
} from "@mantine/core";
import { notifications, Notifications } from "@mantine/notifications";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import { Assets } from "./assets/assets";
import { Graphics } from "./graphics/graphics";
import { Navbar } from "./navbar/navbar";
import { Sound } from "./sound/sound";
import { Workspace } from "./workspace/workspace";
import { Settings } from "./settings/settings";
import { useSocketEvent, useSocketIOEvent } from "./hooks/use-socket";
import { CheckIcon, CloudOff } from "lucide-react";
import { useState } from "react";

const nodecgColours: MantineColorsTuple = [
	"#f2f4f8",
	"#e4e5e8",
	"#c4cad3",
	"#a2acbe",
	"#8593ac",
	"#7384a2",
	"#697c9d",
	"#586a8a",
	"#4d5e7c",
	"#3f516f",
];

const darkColours: MantineColorsTuple = [
	"#e0e7ff",
	"#7f9cf5",
	"#4c51bf",
	"#2b6cb0",
	"#1a365d",
	"#2c5282",
	"#2a4365",
	"#1a202c",
	"#0f172a",
	"#000000",
];

const lightColours: MantineColorsTuple = [
	"#000000",
	"#1a202c",
	"#2d3748",
	"#4a5568",
	"#718096",
	"#a0aec0",
	"#cbd5e0",
	"#e2e8f0",
	"#edf2f7",
	"#f7fafc",
];

const theme = createTheme({
	autoContrast: true,
	colors: {
		nodecg: nodecgColours,
		dark: darkColours,
		light: lightColours,
	},
	primaryColor: "nodecg",
});

const router = createBrowserRouter([
	{
		path: "/",
		Component: Root,
		children: [
			{
				path: "dashboard/*",
				Component: Workspace,
			},
			{
				path: "graphics",
				Component: Graphics,
			},
			{
				path: "assets",
				Component: Assets,
			},
			{
				path: "sound",
				Component: Sound,
			},
			{
				path: "settings",
				Component: Settings,
			},
		],
	},
]);

export interface AppContext {
	isConnected: boolean;
}

function Root() {
	const [isConnected, setIsConnected] = useState(true);

	useSocketEvent("disconnect", () => {
		setIsConnected(false);

		notifications.show({
			title: "Disconnected",
			message: "Lost connection to the NodeCG server.",
			color: "red",
			autoClose: false,
			withCloseButton: false,
			id: "nodecg-disconnected",
			icon: <CloudOff />,
		});
	});

	useSocketIOEvent("reconnect_attempt", () => {
		notifications.update({
			title: "Reconnecting...",
			message: "Attempting to reconnect to the NodeCG server...",
			color: "yellow",
			autoClose: false,
			withCloseButton: false,
			loading: true,
			id: "nodecg-disconnected",
			icon: null,
		});
	});

	useSocketIOEvent("reconnect", () => {
		setIsConnected(true);

		notifications.update({
			title: "Reconnected",
			message: "Reconnected to the NodeCG server.",
			color: "green",
			autoClose: 3000,
			loading: false,
			withCloseButton: true,
			id: "nodecg-disconnected",
			icon: <CheckIcon />,
		});
	});

	return (
		<div style={{ display: "flex" }}>
			<Navbar workspaces={window.__renderData__.workspaces} />
			<Outlet context={{ isConnected } satisfies AppContext} />
		</div>
	);
}

function NCGDashboard() {
	return (
		<MantineProvider theme={theme} defaultColorScheme="dark">
			<RouterProvider router={router} />
			<Notifications />
		</MantineProvider>
	);
}

const domNode = document.getElementById("app");

if (domNode) {
	createRoot(domNode).render(<NCGDashboard />);
}
