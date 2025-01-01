import fs from "node:fs";
import path from "node:path";

import generatedTypesPackageJson from "../generated-types/package.json";
import rootPackageJson from "../package.json";

const rootPackages = {
	...rootPackageJson.dependencies,
	...rootPackageJson.devDependencies,
};

const dependencies = Object.keys(
	generatedTypesPackageJson.dependencies,
) as (keyof typeof generatedTypesPackageJson.dependencies)[];

for (const dependency of dependencies) {
	const version = rootPackages[dependency];
	generatedTypesPackageJson.dependencies[dependency] = version;
}

const devDependencies = Object.keys(
	generatedTypesPackageJson.devDependencies,
) as (keyof typeof generatedTypesPackageJson.devDependencies)[];

for (const devDependency of devDependencies) {
	const version = rootPackages[devDependency];
	generatedTypesPackageJson.devDependencies[devDependency] = version;
}

fs.writeFileSync(
	path.join(__dirname, "../generated-types/package.json"),
	JSON.stringify(generatedTypesPackageJson, null, 2),
);
