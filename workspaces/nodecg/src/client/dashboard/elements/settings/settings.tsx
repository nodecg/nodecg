import classes from "./settings.module.css";
import { AuthKey } from "./auth-key";

export function Settings() {
	const isAuthEnabled = Boolean(
		window.ncgConfig?.login?.enabled && window.token,
	);

	return (
		<div className={classes["container"]}>
			{isAuthEnabled && <AuthKey />}
			{/* Temp */}
			{!isAuthEnabled && <div>No settings available</div>}
		</div>
	);
}

