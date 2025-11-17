import { Button } from "@mantine/core";
import type { NodeCG } from "../../../../types/nodecg";
import { Trash } from "lucide-react";

import styles from "./asset-file.module.css";

type AssetFileProps = {
	asset: NodeCG.AssetFile;
};

export function AssetFile({ asset }: AssetFileProps) {
	async function handleDelete() {
		try {
			await fetch(asset.url, {
				method: "DELETE",
				credentials: "include",
			});
		} catch (err) {
			console.error("Network/delete error:", err);
		}
	}

	return (
		<div className={styles["file"]}>
			<a href={asset.url} target="_blank" rel="noreferrer">
				{asset.name}
				{asset.ext}
			</a>
			<Button onClick={handleDelete} color="red" leftSection={<Trash />}>
				Delete
			</Button>
		</div>
	);
}
