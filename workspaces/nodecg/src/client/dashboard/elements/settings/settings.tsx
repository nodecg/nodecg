import classes from "./settings.module.css";
import { AuthKey } from "./auth-key";
import { ColourThemeToggle } from "./colour-theme-toggle";

export function Settings() {
	const isAuthEnabled = Boolean(
		window.ncgConfig?.login?.enabled && window.token,
	);

	return (
		<div className={classes["container"]}>
			<ColourThemeToggle />
			{isAuthEnabled && <AuthKey />}
		</div>
	);
}
