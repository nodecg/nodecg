import { Command } from "@effect/cli";

import packageJson from "../package.json" with { type: "json" };
import { defaultconfigCommand } from "./commands/defaultconfig.js";
import { installCommand } from "./commands/install.js";
import { schemaTypesCommand } from "./commands/schema-types.js";
import { setupCommand } from "./commands/setup.js";
import { startCommand } from "./commands/start.js";
import { uninstallCommand } from "./commands/uninstall.js";

const command = Command.make("nodecg").pipe(
	Command.withSubcommands([
		setupCommand,
		installCommand,
		startCommand,
		defaultconfigCommand,
		uninstallCommand,
		schemaTypesCommand,
	]),
);

export const cli = Command.run(command, {
	name: "nodecg",
	version: packageJson.version,
});
