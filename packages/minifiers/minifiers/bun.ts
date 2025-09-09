import { spawn } from 'child_process';
import { collectStream } from '@minification-benchmarks/utils/collect-stream';
import { createMinifier } from '../utils/create-minifier.js';

const bunPath = new URL('../node_modules/.bin/bun', import.meta.url).pathname;

export default createMinifier(
	'bun',
	{
		default: async ({ filePath }) => {
			const minify = spawn(bunPath, [
				'build', 
				'--no-bundle',
				
				// When no target is specified, bun assumes you're building for
				// the browser. When building for the browser, bun sets
				// `process.browser` to true to match various bundlers. In the future,
				// Bun may disable this behavior when `--no-bundle` is passed, but
				// for now it does not.
				//
				// When running TypeScript transpiled for the browser inside of
				// Node.js, TypeScript defaults to including \r\n when no "sys"
				// object is provided, which happens when process.browser
				// evaluates to true.
				//
				// Since the spirit of this benchmark is mostly targeting browsers,
				// we should keep it as implicit --target=browser even though the code
				// testing it is not a browser.
				'--define=process.browser:undefined',

				'--minify', 
				filePath,
			]);

			const [error, minified] = await Promise.all([
				collectStream(minify.stderr),
				collectStream(minify.stdout),
			]);

			if (error && error.includes('\nerror: ')) {
				throw error;
			}

			return minified;
		},
	},
);
