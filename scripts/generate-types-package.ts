// Native
import fs from 'fs';
import path from 'path';

// Packages
import appRootPath from 'app-root-path';
import { mkdirpSync } from 'fs-extra';
import { execSync } from 'child_process';
import cpy from 'cpy';

const pjsonPath = path.join(appRootPath.path, 'package.json');
const rootNodeModulesPath = appRootPath.resolve('node_modules');
const tmpNodeModulesPath = appRootPath.resolve('tmp_node_modules');
const outputDir = appRootPath.resolve('generated-types');

const generate = async () => {
	const rawContents = fs.readFileSync(pjsonPath, 'utf8');
	const pjson = JSON.parse(rawContents);

	/**
	 * List of dependencies that should be included in the types package.
	 * This is a subset of the dependencies in the root package.json.
	 * If this script fails in the subsequent `npx tsc`, it's likely because a dependency is missing from this list.
	 */
	const TYPES_PACKAGE_DEPENDENCIES = [
		'@polymer/polymer',
		'@sentry/node',
		'@sentry/browser',
		'@types/cookie-parser',
		'@types/express-session',
		'@types/multer',
		'@types/node',
		'@types/passport',
		'@types/soundjs',
		'ajv',
		'connect-typeorm',
		'socket.io',
		'socket.io-client',
		'ts-essentials',
		'typeorm',
		'winston',
	];

	mkdirpSync(outputDir);

	// Generate the package.json for the types package
	fs.writeFileSync(
		path.join(outputDir, 'package.json'),
		JSON.stringify(
			{
				name: '@nodecg/types',
				description: 'Typings package for NodeCG',
				types: 'index.d.ts',
				version: pjson.version,
				repository: pjson.repository,
				bugs: pjson.bugs,
				homepage: pjson.homepage,
				license: pjson.license,
				keywords: [...pjson.keywords, 'types'],
				dependencies: TYPES_PACKAGE_DEPENDENCIES.reduce(
					(obj, name) => ({ ...obj, [name]: pjson.dependencies[name] ?? pjson.devDependencies[name] }),
					{},
				),
				devDependencies: {
					typescript: pjson.devDependencies.typescript,
				},
			},
			undefined,
			2,
		),
		{ encoding: 'utf8' },
	);

	// Generate tsconfig for the types package to test that the typings are valid
	fs.writeFileSync(
		path.join(outputDir, 'tsconfig.json'),
		JSON.stringify(
			{
				compilerOptions: {
					strict: true,
					noEmit: true,
					esModuleInterop: true,
				},
				include: ['./**/*.ts'],
			},
			undefined,
			2,
		),
		{ encoding: 'utf8' },
	);

	// Install dependencies in the types package
	execSync('npm i', { cwd: outputDir, stdio: 'inherit' });

	// Copy all .d.ts files from build output to the types package
	await cpy(['./**/*.d.ts'], outputDir, {
		cwd: appRootPath.resolve('./out'),
		parents: true,
	});

	// Copy some files that need to be manually copied
	await cpy('./src/server/types/augment-express-user.d.ts', path.join(outputDir, 'server/types'), {
		cwd: appRootPath.path,
		parents: false,
	});
	await cpy('./src/index.d.ts', outputDir, {
		cwd: appRootPath.path,
		parents: false,
	});

	// Write the browser-specific window augmentation types
	fs.writeFileSync(
		path.join(outputDir, 'augment-window.d.ts'),
		`import { NodeCGAPIClient } from './client/api/api.client';

declare global {
	var NodeCG: typeof NodeCGAPIClient;
	var nodecg: NodeCGAPIClient;
}`,
	);

	// Without removing the root node_modules folder, tsc will use it along with the types package's node_modules
	fs.renameSync(rootNodeModulesPath, tmpNodeModulesPath);

	// Test that the typings and dependencies are valid
	execSync('npx tsc', { cwd: outputDir, stdio: 'inherit' });

	// Roll back the node_modules folder
	fs.renameSync(tmpNodeModulesPath, rootNodeModulesPath);
};

generate()
	.catch((error) => {
		console.error(error);
	})
	.finally(() => {
		// Clean up tmp_node_modules folder if generate() ended up with an error
		if (fs.existsSync(tmpNodeModulesPath)) {
			fs.renameSync(tmpNodeModulesPath, rootNodeModulesPath);
		}
	});
