/*
  @license
	Rollup.js v4.42.0
	Fri, 06 Jun 2025 14:47:38 GMT - commit f76339428586620ff3e4c32fce48f923e7be7b05

	https://github.com/rollup/rollup

	Released under the MIT License.
*/
export { version as VERSION, defineConfig, rollup, watch } from './shared/node-entry.js';
import './shared/parseAst.js';
import '../native.js';
import 'node:path';
import 'path';
import 'node:process';
import 'node:perf_hooks';
import 'node:fs/promises';
