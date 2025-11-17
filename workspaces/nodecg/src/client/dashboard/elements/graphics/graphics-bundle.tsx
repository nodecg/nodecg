import { Accordion, Button, Pill, Table } from "@mantine/core";
import type { NodeCG } from "../../../../types/nodecg";
import Graphic from "./graphic";
import cx from "clsx";

import classes from "./graphics-bundle.module.css";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

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
		<Accordion.Item value={bundle.name} className={classes["accordion-item"]}>
			<Accordion.Control classNames={{ label: classes["accordion-label"] }}>
				{bundle.name}
			</Accordion.Control>
			<Accordion.Panel>
				<div className={classes["metadata"]}>
					<Pill className={classes["pill"]}>v{bundle.version}</Pill>
					{bundle.git && (
						<Pill className={classes["pill"]}>
							{bundle.git.branch} @ {bundle.git.shortHash}
						</Pill>
					)}
					<Pill className={classes["pill"]}>
						{bundle.graphics.length} Graphic{bundle.graphics.length !== 1 && "s"}
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
				<Table striped className={classes["table"]}>
					<Table.Thead className={cx(classes["header"])}>
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
