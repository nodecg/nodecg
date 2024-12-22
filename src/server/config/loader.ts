import * as fs from "node:fs";
import * as path from "node:path";
import { klona as clone } from "klona/json";
import { cosmiconfigSync as cosmiconfig } from "cosmiconfig";
import type { NodeCG } from "../../types/nodecg";
import { nodecgConfigSchema } from "../../types/nodecg-config-schema";

export const loadConfig = (cfgDirOrFile: string) => {
	let isFile = false;
	try {
		isFile = fs.lstatSync(cfgDirOrFile).isFile();
	} catch (error: any) {
		if (error.code !== "ENOENT") {
			throw error;
		}
	}

	const cfgDir = isFile ? path.dirname(cfgDirOrFile) : cfgDirOrFile;
	const cc = cosmiconfig("nodecg", {
		searchPlaces: isFile
			? [path.basename(cfgDirOrFile)]
			: [
					"nodecg.json",
					"nodecg.yaml",
					"nodecg.yml",
					"nodecg.js",
					"nodecg.config.js",
				],
		stopDir: cfgDir,
	});
	const result = cc.search(cfgDir);
	const userCfg = result?.config ?? {};

	if (userCfg?.bundles?.enabled && userCfg?.bundles?.disabled) {
		throw new Error(
			"nodecg.json may only contain EITHER bundles.enabled OR bundles.disabled, not both.",
		);
	} else if (!userCfg) {
		console.info("[nodecg] No config found, using defaults.");
	}

	const parseResult = nodecgConfigSchema.safeParse(userCfg);

	if (!parseResult.success) {
		console.error(
			"[nodecg] Config invalid:",
			parseResult.error.errors[0]?.message,
		);
		throw new Error(parseResult.error.errors[0]?.message);
	}

	const config = parseResult.data;

	// Create the filtered config
	const filteredConfig: NodeCG.FilteredConfig = {
		host: config.host,
		port: config.port,
		baseURL: config.baseURL,
		logging: {
			console: {
				enabled: config.logging.console.enabled,
				level: config.logging.console.level,
				timestamps: config.logging.console.timestamps,
				replicants: config.logging.console.replicants,
			},
			file: {
				enabled: config.logging.file.enabled,
				level: config.logging.file.level,
				timestamps: config.logging.file.timestamps,
				replicants: config.logging.file.replicants,
			},
		},
		login: {
			enabled: config.login.enabled,
		},
		sentry: {
			enabled: config.sentry.enabled,
			dsn: config.sentry.enabled ? config.sentry.dsn : undefined,
		},
	};

	if (config.login.enabled && config.login.steam) {
		filteredConfig.login.steam = {
			enabled: config.login.steam.enabled,
		};
	}

	if (config.login.enabled && config.login.twitch) {
		filteredConfig.login.twitch = {
			enabled: config.login.twitch.enabled,
			clientID: config.login.twitch.enabled
				? config.login.twitch.clientID
				: undefined,
			scope: config.login.twitch.enabled
				? config.login.twitch.scope
				: undefined,
		};
	}

	if (config.login.enabled && config.login.local) {
		filteredConfig.login.local = {
			enabled: config.login.local.enabled,
		};
	}

	if (config.login.enabled && config.login.discord) {
		filteredConfig.login.discord = {
			enabled: config.login.discord.enabled,
			clientID: config.login.discord.enabled
				? config.login.discord.clientID
				: undefined,
			scope: config.login.discord.enabled
				? config.login.discord.scope
				: undefined,
		};
	}

	if (config.ssl) {
		filteredConfig.ssl = {
			enabled: config.ssl.enabled,
		};
	}

	return {
		config: clone(config),
		filteredConfig: clone(filteredConfig),
	};
};
