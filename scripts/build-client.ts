import * as fs from 'node:fs/promises';
import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

const main = async () => {
	const isWatch = process.argv.includes('--watch');
	await fs.rm('dist', { recursive: true, force: true });
	const options: esbuild.BuildOptions = {
		entryPoints: ['src/client/bundles/*.ts'],
		entryNames: '[name]',
		outdir: 'dist',
		bundle: true,
		minify: true,
		sourcemap: true,
		target: 'es2016',
		platform: 'browser',
		plugins: [
			copy({
				assets: {
					from: ['src/client/manifest.json', 'src/client/favicon.ico'],
					to: '.',
				},
			}),
			copy({
				assets: {
					from: 'src/client/dashboard/img/**/*',
					to: 'dashboard/img',
				},
			}),
			copy({
				assets: {
					from: 'src/client/dashboard/css/**/*',
					to: 'dashboard/css',
				},
			}),
			copy({
				assets: {
					from: 'src/client/instance/**/*',
					to: 'instance',
				},
			}),
			copy({
				assets: {
					from: 'src/client/login/**/*',
					to: 'login',
				},
			}),
		],
		define: {
			'process.env.NODE_ENV': '"production"',
			// Required for "util" package
			'process.env.NODE_DEBUG': 'false',
		},
	};
	if (isWatch) {
		const context = await esbuild.context(options);
		await context.watch();
	} else {
		await esbuild.build(options);
	}
};

void main();
