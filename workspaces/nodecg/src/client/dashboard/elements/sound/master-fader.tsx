import { EditableSlider } from "./editable-slider";
import { useReplicant } from "../hooks/use-replicant";

export function MasterFader() {
	const [masterVolume, setMasterVolume] = useReplicant<number>("volume:master", "_sounds");


	function onMasterVolumeChange(value: number) {
		setMasterVolume(value);
	}

	return (
		<EditableSlider
			SliderProps={{
				color: "nodecg",
				size: "xl",
				radius: "sm",
				marks: [{ value: 25 }, { value: 50 }, { value: 75 }],
				disabled: masterVolume === undefined,
			}}
			NumberInputProps={{
				min: 0,
				clampBehavior: "strict",
				allowNegative: false,
				suffix: "%",
			}}
			value={masterVolume ?? 0}
			onChange={onMasterVolumeChange}
		/>
	);
}
