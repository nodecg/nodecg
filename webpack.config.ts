import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';

const isDev = process.env.NODE_ENV !== 'production';
const mode = isDev ? 'development' : 'production';
const instrument = process.env.NODECG_INSTRUMENT?.toLowerCase() === 'true';

const outDir = instrument ? 'client' : 'client';
const what: webpack.RuleSetRule = instrument
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

if (instrument) {
	console.info('Creating instrumented build for code coverage.');
}

console.info('Mode:', mode);

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
		path: path.resolve(__dirname, `build/${outDir}`),
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
			what,
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
