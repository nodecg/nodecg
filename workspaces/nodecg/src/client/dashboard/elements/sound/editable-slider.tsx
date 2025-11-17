import {
	NumberInput,
	type NumberInputProps,
	Slider,
	type SliderProps,
} from "@mantine/core";
import classes from "./editable-slider.module.css";

type EditableSliderProps = {
	SliderProps?: SliderProps;
	NumberInputProps?: NumberInputProps;
	value: number;
	onChange: (value: number) => void;
};

export function EditableSlider({
	SliderProps,
	NumberInputProps,
	value,
	onChange,
}: EditableSliderProps) {
	function onNumberInputChange(value: number | string) {
		if (typeof value === "string") {
			value = parseFloat(value);
		}

		onChange(value);
	}

	return (
		<div className={classes["container"]}>
			<Slider
				value={value}
				onChange={onChange}
				className={classes["slider"]}
				{...SliderProps}
			/>
			<NumberInput
				value={value}
				onChange={onNumberInputChange}
				className={classes["number-input"]}
				{...NumberInputProps}
			/>
		</div>
	);
}
