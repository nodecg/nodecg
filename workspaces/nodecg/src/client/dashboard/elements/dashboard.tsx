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

const nodecgColor: MantineColorsTuple = [
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

const theme = createTheme({
	autoContrast: true,
	colors: {
		nodecg: nodecgColor,
		// dark: nodecgColor,
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

function Root() {
	return (
		<div style={{ display: "flex" }}>
			<Navbar workspaces={window.__renderData__.workspaces} />
			<Outlet />
		</div>
	);
}

function NCGDashboard() {
	useSocketEvent("disconnect", () => {
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
		<MantineProvider theme={theme} defaultColorScheme="dark">
			<Notifications />
			<RouterProvider router={router} />
		</MantineProvider>
	);
}

const domNode = document.getElementById("app");

if (domNode) {
	createRoot(domNode).render(<NCGDashboard />);
}
