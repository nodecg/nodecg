import { ActionIcon, Table } from "@mantine/core";
import type { NodeCG } from "../../../../types/nodecg";
import { Check, CircleX, Clock2, RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import classes from "./graphics-instances.module.css";

type GraphicsInstancesProps = {
	instances: NodeCG.GraphicsInstance[];
};

export function GraphicsInstances({ instances }: GraphicsInstancesProps) {
	const sortedInstances = [...instances].sort((a, b) => {
		// Sort by bundle alphabetically
		if (a.bundleName < b.bundleName) {
			return -1;
		}

		if (a.bundleName > b.bundleName) {
			return 1;
		}

		// Sort by graphic alphabetically

		if (a.pathName < b.pathName) {
			return -1;
		}

		if (a.pathName > b.pathName) {
			return 1;
		}

		// Then sort by timestamp
		if (a.timestamp < b.timestamp) {
			return 1;
		}

		if (a.timestamp > b.timestamp) {
			return -1;
		}

		return 0;
	});

	return (
		<Table striped withTableBorder className={classes["table"]}>
			<Table.Thead className={classes["table-header"]}>
				<Table.Tr>
					<Table.Th>Bundle</Table.Th>
					<Table.Th>Graphic</Table.Th>
					<Table.Th>IP</Table.Th>
					<Table.Th>Status</Table.Th>
					<Table.Th>Alive Time</Table.Th>
					<Table.Th>Reload</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{sortedInstances.map((instance) => (
					<GraphicInstance key={instance.socketId} instance={instance} />
				))}
			</Table.Tbody>
		</Table>
	);
}

const GraphicStatuses = {
	nominal: {
		message: "Latest",
		icon: <Check style={{ marginRight: 8 }} color="#00A651" />,
	},
	outOfDate: {
		message: "Out of Date",
		icon: <TriangleAlert style={{ marginRight: 8 }} color="#FFC700" />,
	},
	closed: { message: "Closed", icon: <CircleX style={{ marginRight: 8 }} color="#FF7575" /> },
	error: { message: "Error", icon: <CircleX style={{ marginRight: 8 }} color="#FF7575" /> },
} as const;

function GraphicInstance({ instance }: { instance: NodeCG.GraphicsInstance }) {
	const [isReloading, setIsReloading] = useState(false);
	const [graphicLiveTime, setGraphicLiveTime] = useState(timeSince(instance.timestamp));

	// Update live time every second
	// This could be optimized to a single timer for all instances if needed
	useEffect(() => {
		const interval = setInterval(() => {
			setGraphicLiveTime(timeSince(instance.timestamp));
		}, 1000);

		return () => clearInterval(interval);
	}, [instance.timestamp]);

	let status: keyof typeof GraphicStatuses = "error";
	if (instance) {
		if (instance.open) {
			status = instance.potentiallyOutOfDate ? "outOfDate" : "nominal";
		} else {
			status = "closed";
		}
	}

	const statusDetails = GraphicStatuses[status];

	function reload() {
		setIsReloading(true);
		window.socket.emit("graphic:requestRefresh", instance, () => {
			setIsReloading(false);
		});
	}

	const graphicFile = instance.pathName.split("/").slice(4).join("/");

	return (
		<Table.Tr className={classes["table-row"]}>
			<Table.Td>{instance.bundleName}</Table.Td>
			<Table.Td>{graphicFile}</Table.Td>
			<Table.Td>{instance.ipv4}</Table.Td>
			<Table.Td>
				<div style={{ display: "flex", alignItems: "center" }}>
					{statusDetails.icon} {statusDetails.message}
				</div>
			</Table.Td>
			<Table.Td>
				<div style={{ display: "flex", alignItems: "center" }}>
					<Clock2 style={{ marginRight: 8 }} /> {graphicLiveTime}
				</div>
			</Table.Td>
			<Table.Td>
				<ActionIcon variant="filled" onClick={reload} disabled={isReloading}>
					<RefreshCw />
				</ActionIcon>
			</Table.Td>
		</Table.Tr>
	);
}

// Maybe a date library would be better for this
function timeSince(date: number) {
	const seconds = Math.floor(new Date().getTime() / 1000 - date / 1000);
	let interval = Math.floor(seconds / 31536000);

	if (interval > 1) {
		return `${interval} year`;
	}

	interval = Math.floor(seconds / 2592000);
	if (interval > 1) {
		return `${interval} month`;
	}

	interval = Math.floor(seconds / 86400);
	if (interval >= 1) {
		return `${interval} day`;
	}

	interval = Math.floor(seconds / 3600);
	if (interval >= 1) {
		return `${interval} hour`;
	}

	interval = Math.floor(seconds / 60);
	if (interval > 1) {
		return `${interval} min`;
	}

	return `${Math.floor(seconds)} sec`;
}
