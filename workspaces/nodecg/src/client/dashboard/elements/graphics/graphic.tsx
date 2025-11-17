import { useState } from "react";
import { ActionIcon, Button, CopyButton, Table, Tooltip } from "@mantine/core";
import type { NodeCG } from "../../../../types/nodecg";

import classes from "./graphic.module.css";
import { Check, Copy, RefreshCw } from "lucide-react";

type GraphicProps = {
	graphic: NodeCG.Bundle.Graphic;
	instances: NodeCG.GraphicsInstance[];
	tempAccordion?: boolean;
};

export default function Graphic({ graphic, instances }: GraphicProps) {
	const [isReloadingAllInstances, setIsReloadingAllInstances] = useState(false);

	const fullUrl = new URL(graphic.url, window.location.origin);
	if (window.ncgConfig.login?.enabled && window.token) {
		fullUrl.searchParams.set("key", window.token);
	}

	function reloadAllInstances() {
		setIsReloadingAllInstances(true);
		window.socket.emit("graphic:requestRefreshAll", graphic, () => {
			setIsReloadingAllInstances(false);
		});
	}

	function obsUrlDragStart(e: React.DragEvent) {
		if (!e.target || !e.dataTransfer) {
			return;
		}

		const dragged = e.target as HTMLAnchorElement;
		let obsURL;
		if (window.ncgConfig.login.enabled && window.token) {
			obsURL = `${dragged.href}&`;
		} else {
			obsURL = `${dragged.href}?`;
		}

		obsURL += `layer-name=${graphic.file.replace(".html", "")}&layer-height=${graphic.height}&layer-width=${graphic.width}`;

		e.dataTransfer.setData("text/uri-list", obsURL);
	}

	const graphicFile = graphic.url.split("/").slice(4).join("/");

	return (
		<Table.Tr className={classes["table-row"]}>
			<Table.Td>
				<div style={{ display: "flex", alignItems: "center" }}>
					<CopyButton value={fullUrl.toString()} timeout={2000}>
						{({ copied, copy }) => (
							<Tooltip
								label={copied ? "Copied" : "Copy"}
								withArrow
								position="right"
							>
								<ActionIcon
									color={copied ? "teal" : "gray"}
									variant="light"
									onClick={copy}
									style={{ marginRight: 8 }}
								>
									{copied ? <Check height="70%" /> : <Copy height="70%" />}
								</ActionIcon>
							</Tooltip>
						)}
					</CopyButton>
					<a
						href={fullUrl.toString()}
						target="_blank"
						rel="noopener noreferrer"
						onDragStart={obsUrlDragStart}
					>
						{graphicFile}
					</a>
				</div>
			</Table.Td>
			<Table.Td>
				{graphic.width} × {graphic.height}
			</Table.Td>
			<Table.Td style={{ textAlign: "right" }}>
				{instances.length > 0 && (
					<Button
						disabled={isReloadingAllInstances}
						onClick={reloadAllInstances}
						leftSection={<RefreshCw />}
						variant="gradient"
					>
						Reload {instances.length}{" "}
						{instances.length === 1 ? "Instance" : "Instances"}
					</Button>
				)}
			</Table.Td>
		</Table.Tr>
	);
}
