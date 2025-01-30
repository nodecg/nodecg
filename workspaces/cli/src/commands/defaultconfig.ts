import fs from "node:fs";
import path from "node:path";

import { nodecgPath } from "@nodecg/internal-util";
import { Ajv, type JSONSchemaType } from "ajv";
import chalk from "chalk";
import { Command } from "commander";

import { isBundleFolder } from "../lib/util.js";

const ajv = new Ajv({ useDefaults: true, strict: true });

export function defaultconfigCommand(program: Command) {
	program
		.command("defaultconfig [bundle]")
		.description("Generate default config from configschema.json")
		.action(action);
}

function action(bundleName?: string) {
	const cwd = process.cwd();

	if (!bundleName) {
		if (isBundleFolder(cwd)) {
			bundleName = bundleName ?? path.basename(cwd);
		} else {
			console.error(
				`${chalk.red("Error:")} No bundle found in the current directory!`,
			);
			return;
		}
	}

	const bundlePath = path.join(nodecgPath, "bundles/", bundleName);
	const schemaPath = path.join(
		nodecgPath,
		"bundles/",
		bundleName,
		"/configschema.json",
	);
	const cfgPath = path.join(nodecgPath, "cfg/");

	if (!fs.existsSync(bundlePath)) {
		console.error(`${chalk.red("Error:")} Bundle ${bundleName} does not exist`);
		return;
	}

	if (!fs.existsSync(schemaPath)) {
		console.error(
			`${chalk.red("Error:")} Bundle ${bundleName} does not have a configschema.json`,
		);
		return;
	}

	if (!fs.existsSync(cfgPath)) {
		fs.mkdirSync(cfgPath);
	}

	const schema: JSONSchemaType<unknown> = JSON.parse(
		fs.readFileSync(schemaPath, "utf8"),
	);
	const configPath = path.join(nodecgPath, "cfg/", `${bundleName}.json`);
	if (fs.existsSync(configPath)) {
		console.error(
			`${chalk.red("Error:")} Bundle ${bundleName} already has a config file`,
		);
	} else {
		try {
			const validate = ajv.compile(schema);
			const data = {};
			validate(data);

			fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
			console.log(
				`${chalk.green("Success:")} Created ${chalk.bold(bundleName)}'s default config from schema\n`,
			);
		} catch (error) {
			console.error(chalk.red("Error:"), error);
		}
	}
}
