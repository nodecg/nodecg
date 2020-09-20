// Native
import path from 'path';

// Packages
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import appRootPath from 'app-root-path';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

export function createBrowserConfig({
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
			dashboard: './src/client/dashboard/elements/ncg-dashboard.ts',
			socket: './src/client/socket.ts',
			api: './src/client/api/api.client.ts',
			client_registration: './src/client/instance/client_registration.ts',
			dialog_opener: './src/client/dashboard/js/dialog_opener.ts',
		},
		output: {
			path: path.join(appRootPath.path, 'build/client'),
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
								configFile: 'src/client/tsconfig.json',
							},
						},
					],
				},
				{ test: /\.js$/, loader: 'babel-loader' },
				instrumentationRule,
			],
		},
		plugins: [
			new webpack.EnvironmentPlugin({
				BROWSER: true,
			}),
			new CopyPlugin([
				'src/client/manifest.json',
				'src/client/favicon.ico',
				{ from: 'src/client/dashboard/img/', to: 'dashboard/img', toType: 'dir' },
				{ from: 'src/client/dashboard/css/', to: 'dashboard/css', toType: 'dir' },
				{ from: 'src/client/instance/', to: 'instance', toType: 'dir' },
				{ from: 'src/client/login/', to: 'login', toType: 'dir' },
			]),
			new ForkTsCheckerWebpackPlugin({
				typescript: {
					configFile: 'src/client/tsconfig.json'
				}
			}),
		],
	};
}
