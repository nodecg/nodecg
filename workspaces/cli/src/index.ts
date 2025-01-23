import { Command } from "commander";

import packageJson from "../package.json" with { type: "json" };
import { setupCommands } from "./commands/index.js";

export function setupCLI() {
	process.title = "nodecg";

	const program = new Command("nodecg");

	// Initialise CLI
	program.version(packageJson.version).usage("<command> [options]");

	// Initialise commands
	setupCommands(program);

	// Handle unknown commands
	program.on("*", () => {
		console.log("Unknown command:", program.args.join(" "));
		program.help();
	});

	// Print help if no commands were given
	if (!process.argv.slice(2).length) {
		program.help();
	}

	// Process commands
	program.parse(process.argv);
}
