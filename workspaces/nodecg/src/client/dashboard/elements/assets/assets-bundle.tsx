import { Accordion } from "@mantine/core";
import type { NodeCG } from "../../../../types/nodecg";
import { AssetCategory } from "./asset-category";

type AssetsBundleProps = {
	collection: NodeCG.Collection;
};

export function AssetsBundle({ collection }: AssetsBundleProps) {
	console.log(collection);

	return (
		<div>
			<h2>{collection.name}</h2>
			<Accordion variant="separated">
				{collection.categories.map((category) => {
					return (
						<AssetCategory
							key={category.name}
							category={category}
							collectionName={collection.name}
						/>
					);
				})}
			</Accordion>
		</div>
	);
}
