import { useState } from "react";
import { Select } from "@mantine/core";

import styles from "./sound-cue.module.css";
import { EditableSlider } from "./editable-slider";

import type { NodeCG } from "../../../../types/nodecg";

type SoundCueProps = {
	soundCue: NodeCG.SoundCue;
	sounds: NodeCG.AssetFile[];
};

export function SoundCue({ soundCue, sounds }: SoundCueProps) {
	const [volume, setVolume] = useState(soundCue.volume);
	const [selectedSound, setSelectedSound] = useState<string | null>(
		soundCue.file?.sum ?? "",
	);

	function handleVolumeChange(newVolume: number) {
		setVolume(newVolume);
		soundCue.volume = newVolume;
		// console.log("Updated sound cue:", soundCue);
	}

	function handleSoundChange(newSound: string | null) {
		setSelectedSound(newSound);
		if (newSound === null || newSound === "") {
			soundCue.file = undefined;
		} else if (newSound === "default") {
			soundCue.file = soundCue.defaultFile;
		} else {
			const asset = sounds.find((a) => a.sum === newSound);
			if (asset) {
				soundCue.file = { ...asset, default: false };
			}
		}
	}

	return (
		<div className={styles["sound-cue"]}>
			<span>{soundCue.name}</span>

			{soundCue.assignable ? (
				<Select
					data={[
						{ label: "None", value: "" },
						...(soundCue.defaultFile
							? [{ label: "Default", value: "default" }]
							: []),
						...sounds.map((sound) => ({
							label: sound.name,
							value: sound.sum,
						})),
					]}
					value={selectedSound}
					onChange={handleSoundChange}
					color="nodecg"
					clearable
					searchable
				/>
			) : (
				<span className={styles["centred"]}>
					{soundCue.file?.name ?? "No sound assigned"}
				</span>
			)}
			<EditableSlider
				SliderProps={{
					color: "nodecg",
				}}
				NumberInputProps={{
					min: 0,
					clampBehavior: "strict",
					allowNegative: false,
					suffix: "%",
				}}
				value={volume}
				onChange={handleVolumeChange}
			/>
		</div>
	);
}
