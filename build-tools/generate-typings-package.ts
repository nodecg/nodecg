// Native
import fs from 'fs';
import path from 'path';

// Packages
import appRootPath from 'app-root-path';
import ts from 'typescript';
import { mkdirpSync } from 'fs-extra';

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

				const relativePathToFauxModules = path.relative(
					path.dirname(inputPathToOutputPath(lastSourceFile)),
					fauxModules,
				);

				return context.factory.updateImportDeclaration(
					node,
					undefined,
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
		JSON.stringify({
			name: '@nodecg/types',
			description: 'Typings package for NodeCG',
			main: 'index.d.ts',
			version: pjson.version,
			repository: pjson.repository,
			bugs: pjson.bugs,
			homepage: pjson.homepage,
			license: pjson.license,
			keywords: [...pjson.keywords, 'types'],
			devDependencies: {
				// Because these are referenced via a triple-slash directive, our rollup d.ts bundler can't include them.
				// So, we have to manually specify them here to ensure that they are available to consumers of our types.
				'@types/soundjs': pjson.devDependencies['@types/soundjs'],
			},
		}),
		{ encoding: 'utf8' },
	);

	// Generate the index.d.ts file that ties the whole thing together
	fs.writeFileSync(
		path.join(outputDir, 'index.d.ts'),
		`export * from './client/api/api.client'
import serverApiFactory from './server/api.server'
export type NodeCGAPIServer = InstanceType<ReturnType<typeof serverApiFactory>>`,
		'utf8',
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

rewriteTypePaths(path.resolve(appRootPath.path, 'build-types/client/api/api.client.d.ts'));
rewriteTypePaths(path.resolve(appRootPath.path, 'build-types/server/api.server.d.ts'));
generateFinishingTouches();
