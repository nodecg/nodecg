import { useEffect, useState } from "react";
import type { NodeCG as NodeCGTypes } from "../../../../types/nodecg";
import GraphicsBundle from "./graphics-bundle";
import { GraphicsInstances } from "./graphics-instances";
import { Accordion } from "@mantine/core";

import styles from "./graphics.module.css";

export function Graphics() {
	const [instances, setInstances] = useState<NodeCGTypes.GraphicsInstance[]>(
		[],
	);
	const bundlesWithGraphics = window.__renderData__.bundles.filter(
		(bundle) => bundle.graphics && bundle.graphics.length > 0,
	);

	useEffect(() => {
		const instancesRep = NodeCG.Replicant<NodeCGTypes.GraphicsInstance[]>(
			"graphics:instances",
			"nodecg",
		);

		const handleChange = (
			newVal: NodeCGTypes.GraphicsInstance[] | undefined,
		) => {
			if (newVal) {
				const newInstances = newVal.map((instance) => ({ ...instance }));
				setInstances(newInstances);
				console.log("Instances changed", newInstances);
			}
		};

		instancesRep.on("change", handleChange);

		// Cleanup subscription on unmount
		return () => {
			instancesRep.removeListener("change", handleChange);
		};
	}, []);

	return (
		<div className={styles["page"]}>
			<h1>Graphics</h1>
			<Accordion variant="separated">
				{bundlesWithGraphics.map((bundle) => (
					<GraphicsBundle
						key={bundle.name}
						bundle={bundle}
						instances={instances}
					/>
				))}
			</Accordion>
			<h2>Instances</h2>
			<GraphicsInstances instances={instances} />
		</div>
	);
}
