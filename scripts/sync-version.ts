import fs from "node:fs";

const mainJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const version = mainJson.version;

const typesJson = JSON.parse(
	fs.readFileSync("./generated-types/package.json", "utf-8"),
);
typesJson.version = version;
fs.writeFileSync(
	"./generated-types/package.json",
	JSON.stringify(typesJson, null, 2),
);
