// Native
import * as fs from "fs";
import * as path from "path";

// Ours
import type { NodeCG } from "../../types/nodecg";

export function parseGraphics(
	graphicsDir: string,
	manifest: NodeCG.Manifest,
): NodeCG.Bundle.Graphic[] {
	const graphics: NodeCG.Bundle.Graphic[] = [];

	if (fs.existsSync(graphicsDir) && typeof manifest.graphics === "undefined") {
		// If the graphics folder exists but the nodecg.graphics property doesn't, throw an error.
		throw new Error(
			`${manifest.name} has a "graphics" folder, ` +
				'but no "nodecg.graphics" property was found in its package.json',
		);
	}

	// If nodecg.graphics exists but the graphics folder doesn't, throw an error.
	if (!fs.existsSync(graphicsDir) && typeof manifest.graphics !== "undefined") {
		throw new Error(
			`${manifest.name} has a "nodecg.graphics" property in its package.json, but no "graphics" folder`,
		);
	}

	// If neither the folder nor the manifest exist, return an empty array.
	if (!fs.existsSync(graphicsDir) && typeof manifest.graphics === "undefined") {
		return graphics;
	}

	if (!manifest.graphics) {
		return graphics;
	}

	manifest.graphics.forEach((graphic, index) => {
		const missingProps = [];
		if (typeof graphic.file === "undefined") {
			missingProps.push("file");
		}

		if (typeof graphic.width === "undefined") {
			missingProps.push("width");
		}

		if (typeof graphic.height === "undefined") {
			missingProps.push("height");
		}

		if (missingProps.length) {
			throw new Error(
				`Graphic #${index} could not be parsed as it is missing the following properties: ` +
					missingProps.join(", "),
			);
		}

		// Check if this bundle already has a graphic for this file
		const dupeFound = graphics.some((g) => g.file === graphic.file);
		if (dupeFound) {
			throw new Error(
				`Graphic #${index} (${graphic.file}) has the same file as another graphic in ${manifest.name}`,
			);
		}

		const filePath = path.join(graphicsDir, graphic.file);

		// Check that the panel file exists, throws error if it doesn't
		fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK);

		const parsedGraphic: NodeCG.Bundle.Graphic = {
			...graphic,
			singleInstance: Boolean(graphic.singleInstance),
			url: `/bundles/${manifest.name}/graphics/${graphic.file}`,
		};

		graphics.push(parsedGraphic);
	});

	return graphics;
}
