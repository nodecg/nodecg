import { useEffect, useState } from "react";
import { Breadcrumbs, HoverCard } from "@mantine/core";
import { formatDistanceToNowStrict } from "date-fns";

import classes from "./status-bar.module.css";

import type { NodeCG } from "src/types/nodecg";

interface StatusBarProps {
	bundles: NodeCG.Bundle[];
	startTime: number;
	isConnected: boolean;
	user?: string;
}

export function StatusBar(props: StatusBarProps) {
	const [uptime, setUptime] = useState(
		formatDistanceToNowStrict(props.startTime, {
			addSuffix: false,
		}),
	);
	const [currentTime, setCurrentTime] = useState(Date.now());

	useEffect(() => {
		const interval = setInterval(() => {
			setUptime(
				formatDistanceToNowStrict(props.startTime, {
					addSuffix: false,
				}),
			);

			setCurrentTime(Date.now());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<Breadcrumbs separator="–" className={classes["status-bar"]}>
			<span>NodeCG v{window.__renderData__.version}</span>
			<HoverCard
				width={200}
				shadow="md"
				classNames={{ dropdown: classes["bundle-info"] }}
			>
				<HoverCard.Target>
					<span>{props.bundles.length} Bundles loaded</span>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					{props.bundles.map((bundle) => (
						<div key={bundle.name}>
							{bundle.name} v{bundle.version}
						</div>
					))}
				</HoverCard.Dropdown>
			</HoverCard>
			<span>{new Date(currentTime).toLocaleTimeString()}</span>
			<span>Uptime: {uptime}</span>
			{props.user && <span>User: {props.user ?? "Guest"}</span>}
			<span className={classes["connected-status"]}>
				<div
					className={`${classes["connection-indicator"]} ${props.isConnected ? classes.connected : classes.disconnected}`}
				/>
				{props.isConnected ? "Connected" : "Disconnected"}
			</span>
		</Breadcrumbs>
	);
}
