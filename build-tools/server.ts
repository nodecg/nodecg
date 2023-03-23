// Native
import path from 'path';

// Packages
import type webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import appRootPath from 'app-root-path';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

export function createServerConfig({
	isProduction,
	instrument = false,
}: {
	isProduction: boolean;
	instrument?: boolean;
}): Partial<webpack.Configuration> {
	const instrumentationRule: webpack.RuleSetRule = instrument
		? {
				test: /\.js$|\.ts$/,
				use: {
					loader: '@ephesoft/webpack.istanbul.loader',
					options: { esModules: true },
				},
				enforce: 'post' as const,
				exclude: /node_modules|\.spec\.js$/,
		  }
		: {};

	return {
		target: 'node',
		mode: isProduction ? 'production' : 'development',
		devtool: 'source-map',
		resolve: {
			extensions: ['.ts', '.js', '.json'],
		},
		entry: {
			server: './src/server/bootstrap',
		},
		output: {
			libraryTarget: 'commonjs2',
			path: path.join(appRootPath.path, 'build/server'),
			filename: '[name].js',
		},
		node: {
			__dirname: false,
		},
		externals: [nodeExternals()],
		plugins: [
			new ForkTsCheckerWebpackPlugin({
				typescript: {
					build: true,
					mode: 'write-dts',
					configFile: 'src/server/tsconfig.json',
				},
			}),
			new CopyPlugin({
				patterns: [
					{
						from: 'src/server/**/*.tmpl',
						to() {
							return 'templates/[name][ext]';
						},
					},
				],
			}),
		],
		module: {
			rules: [
				instrumentationRule,
				{
					test: /\.ts$/,
					loader: 'ts-loader',
					options: {
						projectReferences: true,
						configFile: 'src/server/tsconfig.json',
					},
				},
				{ test: /\.js$/, loader: 'babel-loader' },
			],
		},
	};
}
