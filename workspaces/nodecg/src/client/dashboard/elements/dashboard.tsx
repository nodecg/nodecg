import "@mantine/core/styles.css";

import {
	createTheme,
	type MantineColorsTuple,
	MantineProvider,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import { Assets } from "./assets/assets";
import { Graphics } from "./graphics/graphics";
import { Navbar } from "./navbar/navbar";
import { Sound } from "./sound/sound";
import { Workspace } from "./workspace/workspace";
import { Settings } from "./settings/settings";

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
