import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';

const isDev = process.env.NODE_ENV !== 'production';

const config: webpack.Configuration = {
	mode: isDev ? 'development' : 'production',
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
		path: path.resolve(__dirname, 'build/client'),
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
	],
};

export default config;
