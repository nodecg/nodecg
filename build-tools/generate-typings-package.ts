// Native
import fs from 'fs';
import path from 'path';

// Packages
import appRootPath from 'app-root-path';
import ts from 'typescript';
import { mkdirpSync } from 'fs-extra';
import isBuiltinModule from 'is-builtin-module';

const pjsonPath = path.join(appRootPath.path, 'package.json');
const rawContents = fs.readFileSync(pjsonPath, 'utf8');
const pjson = JSON.parse(rawContents);
const outputDir = path.resolve(__dirname, '../generated-types');
const fauxModules = path.join(outputDir, 'faux_modules');

function rewriteTypePaths(filePath: string) {
	const program = ts.createProgram([filePath], {});
	const printer = ts.createPrinter();

	let lastSourceFile = '';
	const importDeclarationTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
		const visit: ts.Visitor = (node) => {
			if (node.getSourceFile()) {
				lastSourceFile = node.getSourceFile().fileName;
			}

			node = ts.visitEachChild(node, visit, context);

			if (ts.isImportDeclaration(node)) {
				const { text } = (node as any).moduleSpecifier;
				const isRelativeImport = text.startsWith('.');
				if (isRelativeImport) {
					return node;
				}

				if (isBuiltinModule(text)) {
					return node;
				}

				const relativePathToFauxModules = path.relative(
					path.dirname(inputPathToOutputPath(lastSourceFile)),
					fauxModules,
				);

				if (!hasTypesPackage(text)) {
					try {
						// Copy this module's package.json if it exists.
						const pkgDir = findRoot(path.dirname(require.resolve(text)));
						const input = path.join(pkgDir, 'package.json');
						if (fs.existsSync(input)) {
							const output = path.resolve(fauxModules, text, 'package.json');
							mkdirpSync(path.dirname(output));
							fs.copyFileSync(input, output);
						}
					} catch (_: unknown) {}
				}

				return context.factory.updateImportDeclaration(
					node,
					undefined,
					node.importClause
						? context.factory.createImportClause(
								false,
								node.importClause.name,
								node.importClause.namedBindings,
						  )
						: undefined,
					context.factory.createStringLiteral(
						hasTypesPackage(text)
							? path.join(relativePathToFauxModules, '@types', text)
							: path.join(relativePathToFauxModules, text),
					),
					undefined,
				);
			}

			return node;
		};

		return (node) => ts.visitNode(node, visit);
	};

	// Run source file through our transformer
	const result = ts.transform(program.getSourceFiles().slice(), [importDeclarationTransformer]);

	// Write pretty printed transformed typescript to output directory
	for (const file of result.transformed) {
		const outputPath = inputPathToOutputPath(file.fileName);
		mkdirpSync(path.dirname(outputPath));
		fs.writeFileSync(outputPath, printer.printFile(file));
	}
}

function generateFinishingTouches() {
	// Generate the package.json for the types package
	fs.writeFileSync(
		path.join(outputDir, 'package.json'),
		JSON.stringify(
			{
				name: '@nodecg/types',
				description: 'Typings package for NodeCG',
				main: 'index.d.ts',
				types: 'index.d.ts',
				version: pjson.version,
				repository: pjson.repository,
				bugs: pjson.bugs,
				homepage: pjson.homepage,
				license: pjson.license,
				keywords: [...pjson.keywords, 'types'],
				devDependencies: {
					// Because these are referenced via a triple-slash directive, this gather process can't include them.
					// So, we have to manually specify them here to ensure that they are available to consumers of our types.
					'@types/soundjs': pjson.devDependencies['@types/soundjs'],
				},
			},
			undefined,
			2,
		),
		{ encoding: 'utf8' },
	);

	// Copy the index.d.ts file that ties the whole thing together
	fs.copyFileSync(path.resolve(appRootPath.path, 'src/index.d.ts'), path.join(outputDir, 'index.d.ts'));

	// Write the browser-specific window augmentation types
	fs.writeFileSync(
		path.join(outputDir, 'augment-window.d.ts'),
		`import { NodeCGAPIClient } from './client/api/api.client';
		
declare global {
	var NodeCG: typeof NodeCGAPIClient;
	var nodecg: NodeCGAPIClient;
}`,
	);
}

function inputPathToOutputPath(filePath: string): string {
	return isNodeModule(filePath)
		? filePath.replace(/.+node_modules/, fauxModules)
		: filePath.replace(/.+build-types/, outputDir);
}

function isNodeModule(filePath: string): boolean {
	return filePath.includes('node_modules');
}

function hasTypesPackage(packageName: string): boolean {
	const typesPackagePath = path.join(appRootPath.path, 'node_modules/@types', packageName);
	return fs.existsSync(typesPackagePath);
}

function findRoot(input: string | string[]): string {
	let start: string | string[] = input;
	if (typeof start === 'string') {
		if (!start.endsWith(path.sep)) {
			start += path.sep;
		}

		start = start.split(path.sep);
	}

	if (!start.length) {
		throw new Error('package.json not found in path');
	}

	start.pop();
	const dir = start.join(path.sep);
	try {
		const pjsonPath = path.join(dir, 'package.json');
		const pjsonExists = fs.existsSync(pjsonPath);
		if (pjsonExists) {
			const dirNameMatchesPjsonName = dir.endsWith(require(pjsonPath).name);
			if (dirNameMatchesPjsonName) {
				return dir;
			}
		}
	} catch (_: unknown) {}

	return findRoot(start);
}

rewriteTypePaths(path.resolve(appRootPath.path, 'build-types/client/api/api.client.d.ts'));
rewriteTypePaths(path.resolve(appRootPath.path, 'build-types/server/api.server.d.ts'));
generateFinishingTouches();
