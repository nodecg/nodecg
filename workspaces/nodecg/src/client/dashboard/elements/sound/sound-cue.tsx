import { useState } from "react";
import { Select } from "@mantine/core";

import { EditableSlider } from "./editable-slider";

import type { NodeCG } from "../../../../types/nodecg";

type SoundCueProps = {
	soundCue: NodeCG.SoundCue;
	sounds: NodeCG.AssetFile[];
};

const NONE_SOUND_OPTION = "None";

export function SoundCue({ soundCue, sounds }: SoundCueProps) {
	const [volume, setVolume] = useState(soundCue.volume);
	const [selectedSound, setSelectedSound] = useState<string | null>(
		soundCue.file?.name ?? NONE_SOUND_OPTION,
	);

	function handleVolumeChange(newVolume: number) {
		setVolume(newVolume);
		soundCue.volume = newVolume;
		// console.log("Updated sound cue:", soundCue);
	}

	function handleSoundChange(newSound: string | null) {
		setSelectedSound(newSound);
		if (newSound === null || newSound === NONE_SOUND_OPTION) {
			soundCue.file = undefined;
		} else if (newSound === "default") {
			soundCue.file = soundCue.defaultFile;
		} else {
			const asset = sounds.find((a) => a.name === newSound);
			if (asset) {
				soundCue.file = { ...asset, default: false };
			}
		}
	}

	return (
		<div
			style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}
		>
			<span style={{ flexGrow: 1 }}>{soundCue.name}</span>

			{soundCue.assignable ? (
				<Select
					data={[
						NONE_SOUND_OPTION,
						...(soundCue.defaultFile ? ["default"] : []),
						...sounds.map((sound) => sound.name),
					]}
					value={selectedSound}
					onChange={handleSoundChange}
					color="nodecg"
				/>
			) : (
				<span>{soundCue.file?.name ?? "No sound assigned"}</span>
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
