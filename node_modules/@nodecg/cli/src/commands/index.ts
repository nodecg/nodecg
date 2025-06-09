import type { Command } from "commander";

import { defaultconfigCommand } from "./defaultconfig.js";
import { installCommand } from "./install.js";
import { schemaTypesCommand } from "./schema-types.js";
import { setupCommand } from "./setup.js";
import { startCommand } from "./start.js";
import { uninstallCommand } from "./uninstall.js";

export function setupCommands(program: Command) {
	defaultconfigCommand(program);
	installCommand(program);
	schemaTypesCommand(program);
	setupCommand(program);
	startCommand(program);
	uninstallCommand(program);
}
