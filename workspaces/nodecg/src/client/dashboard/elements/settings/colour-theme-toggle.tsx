import {
	Button,
	useComputedColorScheme,
	useMantineColorScheme,
} from "@mantine/core";
import { MoonIcon, SunIcon } from "lucide-react";

export function ColourThemeToggle() {
	const { setColorScheme } = useMantineColorScheme();
	const computedColorScheme = useComputedColorScheme("light", {
		getInitialValueInEffect: true,
	});

	return (
		<Button
			onClick={() =>
				setColorScheme(computedColorScheme === "light" ? "dark" : "light")
			}
			variant="default"
			size="xl"
			aria-label="Toggle color scheme"
			rightSection={
				computedColorScheme === "light" ? <MoonIcon /> : <SunIcon />
			}
		>
			{computedColorScheme === "light" ? "Dark Mode" : "Light Mode"}
		</Button>
	);
}
