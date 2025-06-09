# express-transform-bare-module-specifiers [![Build Status](https://travis-ci.com/nodecg/express-transform-bare-module-specifiers.svg?branch=master)](https://travis-ci.com/nodecg/express-transform-bare-module-specifiers) [![codecov](https://codecov.io/gh/nodecg/express-transform-bare-module-specifiers/branch/master/graph/badge.svg)](https://codecov.io/gh/nodecg/express-transform-bare-module-specifiers)

> Express middleware to transform bare module specifiers on-the-fly.

## Usage

1. Install the middleware:

	```bash
	npm i express-transform-bare-module-specifiers
	```
2. Import (or `require`) this package:

	```js
	// ES Modules
	import transformMiddleware from 'express-transform-bare-module-specifiers';

	// CommonJS
	const transformMiddleware = require('express-transform-bare-module-specifiers').default;
	```
3. Configure and apply the middleware:

	```js
	// Using defaults:
	app.use('*', transformMiddleware());
	
	// Using a custom rootDir and modulesUrl:
	app.use('*', transformMiddleware({
		rootDir: path.resolve(__dirname, '/bundles/my-bundle'),
		modulesUrl: '/bundles/my-bundle/node_modules'
	}))
	```
	
- `rootDir`: the project base directory. This should contain the package.json and node_modules of the application. It defaults to `process.cwd()`.
- `modulesUrl`: is the route that you will be serving your `node_modules` directory from. It defaults to `/node_modules`.

## Motivation

ES Modules are great. However, it can be difficult to incorporate existing npm packages, because you have to specify the fully-qualified path to the entrypoint of each and every npm package you wish to use. That is to say: you can't do this:

```js
import * as noop from 'noop3';
```

... you instead must do this (for example):
```js
import * as noop from '../node_modules/noop3/index.js';
```

You can see how this would rapidly become very hard to maintain.

This limitation is present because the ES Modules spec currently does not support so-called ["bare module specifiers"](https://github.com/domenic/import-maps). That is: any module specifier which does not start with a relative or absolute path, such as `/`, `./`, `../`, etc.

This middleware uses [a single babel transform](https://www.npmjs.com/package/babel-plugin-bare-import-rewrite) to convert these "bare module specifiers" in your code to fully-qualified relative paths. This means that you can just write code which references npm packages installed in your `node_modules`, and this middleware will handle translating those package names to fully-qualified paths on-the-fly.

## Acknowledgements

This middleware is based entirely on the implementation found in [`polyserve`](https://github.com/Polymer/tools/tree/master/packages/polyserve). Except, it uses the [`babel-plugin-bare-import-rewrite`](https://www.npmjs.com/package/babel-plugin-bare-import-rewrite) babel plugin instead of [the one built into polymer-build](https://github.com/Polymer/tools/blob/14fea56b16218db369bf5fdce2bb707d78c209c8/packages/build/src/babel-plugin-bare-specifiers.ts).
