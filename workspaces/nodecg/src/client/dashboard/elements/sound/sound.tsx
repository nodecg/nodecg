import { Accordion, Paper } from "@mantine/core";
import { MasterFader } from "./master-fader";
import { BundleSounds } from "./bundle-sounds";

import styles from "./sound.module.css";

export function Sound() {
	const bundlesWithSounds = window.__renderData__.bundles.filter(
		(bundle) => bundle.soundCues && bundle.soundCues.length > 0,
	);


	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				padding: "16px",
				marginLeft: "auto",
				marginRight: "auto",
			}}
		>
			<h1>Sound Mixer</h1>
			<Paper p="md" className={styles["master-fader"]} miw={700}>
				<h2 style={{ marginTop: 0 }}>Master Fader</h2>
				<MasterFader />
			</Paper>
			<br />
			<Accordion variant="separated">
				{bundlesWithSounds.map((bundle) => (
					<BundleSounds key={bundle.name} bundle={bundle} />
				))}
			</Accordion>
		</div>
	);
}
