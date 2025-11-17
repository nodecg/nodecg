import { useEffect, useState } from "react";
// import { Button } from "@mantine/core";
import { NodeCG as NCGTypes } from "../../../../types/nodecg";
import { AssetsBundle } from "./assets-bundle";

import styles from "./assets.module.css";

export function Assets() {
	const [collections, setCollections] = useState<NCGTypes.Collection[]>();

	useEffect(() => {
		const collectionsRep = NodeCG.Replicant<NCGTypes.Collection[]>(
			"collections",
			"_assets",
		);

		const handleChange = (newVal?: NCGTypes.Collection[]) => {
			if (newVal) {
				setCollections(newVal);
				console.log("Collections changed", newVal);
			}
		};

		collectionsRep.on("change", handleChange);

		// Cleanup subscription on unmount
		return () => {
			collectionsRep.removeListener("change", handleChange);
		};
	}, []);

	console.log(collections);

	return (
		<div className={styles["page"]}>
			<h1>Assets</h1>
			{collections?.map((collection) => (
				<AssetsBundle key={collection.name} collection={collection} />
			))}
		</div>
	);
}
