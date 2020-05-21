// Native
import path from 'path';

// Packages
import webpack from 'webpack';
import appRootPath from 'app-root-path';

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
					loader: 'istanbul-instrumenter-loader',
					options: { esModules: true },
				},
				enforce: 'post' as const,
				exclude: /node_modules|\.spec\.js$/,
		  }
		: {};

	return {
		mode: isProduction ? 'production' : 'development',
		devtool: 'source-map',
		resolve: {
			extensions: ['.ts', '.js', '.json'],
		},
		entry: {
			server: './src/server/bootstrap',
		},
		output: {
			path: path.join(appRootPath.path, 'build/server'),
			filename: '[name].js',
		},
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
				instrumentationRule,
			],
		},
	};
}
