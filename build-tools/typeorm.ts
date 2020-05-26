// Native
import path from 'path';

// Packages
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import appRootPath from 'app-root-path';
import glob from 'glob';

export function createTypeORMConfig({
	isProduction,
}: {
	isProduction: boolean;
	instrument?: boolean;
}): Partial<webpack.Configuration> {
	return {
		target: 'node',
		mode: isProduction ? 'production' : 'development',
		devtool: 'source-map',
		optimization: {
			/**
			 * Prevent name mangling, which would break TypeORM.
			 */
			minimize: false,
		},
		// Dynamically generate a `{ [name]: sourceFileName }` map for the `entry` option
		entry: glob
			.sync(path.join(appRootPath.path, 'src/server/database/{migration,entity}/*.ts'))
			.reduce((entries, filename) => {
				const migrationName = path.basename(filename, '.ts');
				return Object.assign({}, entries, {
					[migrationName]: filename,
				});
			}, {}),
		resolve: {
			// Assuming all your migration files are written in TypeScript
			extensions: ['.ts'],
		},
		output: {
			path: path.join(appRootPath.path, 'build/typeorm'),
			/**
			 * The TypeORM docs say that it is crucial that this be "umd".
			 * They do not explain why.
			 */
			libraryTarget: 'umd',
			filename: '[name].js',
		},
		node: {
			__dirname: false,
		},
		externals: [nodeExternals()],
		module: {
			rules: [
				{
					test: /\.ts$/,
					loaders: [
						{
							loader: 'ts-loader',
							options: {
								transpileOnly: true,
								configFile: 'src/server/tsconfig.json',
							},
						},
					],
				},
				{ test: /\.js$/, loader: 'babel-loader' },
			],
		},
	};
}
