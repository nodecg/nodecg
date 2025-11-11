import { Command, CliApp } from "@effect/cli";
import { setupCommand } from "./commands/setup.js";
import { installCommand } from "./commands/install.js";
import { startCommand } from "./commands/start.js";
import { defaultconfigCommand } from "./commands/defaultconfig.js";
import { uninstallCommand } from "./commands/uninstall.js";
import { schemaTypesCommand } from "./commands/schema-types.js";
import packageJson from "../package.json" with { type: "json" };

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

export const cli = CliApp.make({
	name: "nodecg",
	version: packageJson.version,
	summary: "NodeCG broadcast graphics framework CLI",
	command,
});
