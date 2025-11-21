import { useState } from "react";
import { Accordion, Button, Pill, Table } from "@mantine/core";
import { RefreshCw } from "lucide-react";

import type { NodeCG } from "../../../../types/nodecg";

import classes from "./graphics-bundle.module.css";
import Graphic from "./graphic";

type GraphicsBundleProps = {
	bundle: NodeCG.Bundle;
	instances: NodeCG.GraphicsInstance[];
};

export default function GraphicsBundle({
	bundle,
	instances,
}: GraphicsBundleProps) {
	const [isReloadingAllInstances, setIsReloadingAllInstances] = useState(false);

	function reloadAllInstances() {
		setIsReloadingAllInstances(true);
		window.socket.emit("graphic:requestBundleRefresh", bundle.name, () => {
			setIsReloadingAllInstances(false);
		});
	}

	return (
		<Accordion.Item value={bundle.name}>
			<Accordion.Control classNames={{ label: classes["accordion-label"] }}>
				{bundle.name}
			</Accordion.Control>
			<Accordion.Panel>
				<div className={classes["metadata"]}>
					<Pill>v{bundle.version}</Pill>
					{bundle.git && (
						<Pill>
							{bundle.git.branch} @ {bundle.git.shortHash}
						</Pill>
					)}
					<Pill>
						{bundle.graphics.length} Graphic
						{bundle.graphics.length !== 1 && "s"}
					</Pill>
				</div>
				<div className={classes["metadata"]}>
					<Button
						onClick={reloadAllInstances}
						disabled={isReloadingAllInstances}
						leftSection={<RefreshCw />}
						color="yellow"
					>
						Reload All
					</Button>
				</div>
				<Table striped>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Graphic</Table.Th>
							<Table.Th>Resolution</Table.Th>
							<Table.Th></Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{bundle.graphics.map((graphic) => {
							const graphicInstances = instances.filter(
								(instance) =>
									instance.bundleName === bundle.name &&
									instance.pathName === graphic.url,
							);

							return (
								<Graphic
									key={graphic.url}
									graphic={graphic}
									instances={graphicInstances}
								/>
							);
						})}
					</Table.Tbody>
				</Table>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
