import { Accordion } from "@mantine/core";
import { NodeCG as NCGTypes } from "../../../../types/nodecg";
import { SoundCue } from "./sound-cue";

import styles from "./bundle-sounds.module.css";
import { useReplicant } from "../hooks/use-replicant";

type BundleSoundsProps = {
	bundle: NCGTypes.Bundle;
};

export function BundleSounds({ bundle }: BundleSoundsProps) {
	const [soundAssetsRep] = useReplicant<NCGTypes.AssetFile[]>(
		"assets:sounds",
		bundle.name,
	);
	const [soundCuesRep] = useReplicant<NCGTypes.SoundCue[]>(
		"soundCues",
		bundle.name,
	);

	return (
		<Accordion.Item
			value={bundle.name}
			key={bundle.name}
			className={styles["accordion-item"]}
		>
			<Accordion.Control classNames={{ label: styles["accordion-label"] }}>
				<span style={{ fontWeight: "bold", fontSize: "larger" }}>
					{bundle.name}
				</span>
			</Accordion.Control>
			<Accordion.Panel>
				{soundCuesRep?.map((soundCue) => (
					<SoundCue
						key={soundCue.name}
						soundCue={soundCue as NCGTypes.SoundCue}
						sounds={soundAssetsRep ?? []}
					/>
				))}
			</Accordion.Panel>
		</Accordion.Item>
	);
}
