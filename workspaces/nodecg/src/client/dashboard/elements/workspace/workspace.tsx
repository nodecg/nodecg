import { useParams } from "react-router-dom";
import { Alert, Breadcrumbs } from "@mantine/core";

import classes from "./workspace.module.css";
import { PackeryGrid } from "./packery";
import { Panel } from "./panel";
import { NodeCGDialog } from "./dialog";
import { StatusBar } from "./status-bar";
import { useAppContext } from "../hooks/use-app-context";

function locationParser(url?: string): {
	workspace: string;
	isFullbleed: boolean;
} {
	if (!url) {
		return {
			workspace: "default",
			isFullbleed: false,
		};
	}

	const segments = url.split("/").filter((seg) => seg.length > 0);
	let isFullbleed = false;
	if (segments[0] === "fullbleed") {
		isFullbleed = true;
		segments.shift();
	}

	const workspace = segments.join("/") || "default";
	return {
		workspace,
		isFullbleed,
	};
}

export function Workspace() {
	const { "*": splat } = useParams();
	const { workspace, isFullbleed } = locationParser(splat);
	const { isConnected } = useAppContext();

	const bundles = window.__renderData__.bundles;

	const workspacePanels =
		bundles?.flatMap((bundle) =>
			bundle.dashboard.panels.filter((panel) => {
				if (panel.dialog) return false;

				if (panel.fullbleed) {
					if (!isFullbleed) return false;
					return workspace === panel.name;
				}

				return panel.workspace === workspace;
			}),
		) ?? [];

	const dialogPanels = bundles?.flatMap((bundle) =>
		bundle.dashboard.panels.filter((panel) => panel.dialog),
	);

	if (isFullbleed) {
		const fullbleedPanel = workspacePanels[0];
		if (!fullbleedPanel) {
			return (
				<Alert title="Error" color="red">
					Error: This page should be a fullbleed panel but no fullbleed panel
					matching the url was found. Expected a panel named: {workspace}
				</Alert>
			);
		}

		return (
			<div className={classes["fullbleed"]}>
				<Panel key={fullbleedPanel.name} panel={fullbleedPanel} />
				{dialogPanels.map((panel) => (
					<NodeCGDialog key={panel.name} panel={panel} />
				))}
			</div>
		);
	}

	const splitWorkspace = workspace.split("/");

	const breadcrumbs = splitWorkspace.map((part) => {
		return <span>{part}</span>;
	});

	return (
		<div className={classes["workspace"]}>
			{breadcrumbs.length > 1 && (
				<Breadcrumbs className={classes.breadcrumbs}>{breadcrumbs}</Breadcrumbs>
			)}
			<h1>{splitWorkspace.at(-1)}</h1>
			<PackeryGrid
				itemSelector=".ncg-dashboard-panel"
				gutter={16}
				columnWidth={128}
				containerStyle={{ position: "relative" }}
			>
				{workspacePanels.map((panel) => (
					<Panel key={panel.name} panel={panel} />
				))}
			</PackeryGrid>
			<StatusBar
				bundles={bundles}
				startTime={window.__renderData__.startTime}
				isConnected={isConnected}
			/>
			{dialogPanels.map((panel) => (
				<NodeCGDialog key={panel.name} panel={panel} />
			))}
		</div>
	);
}
