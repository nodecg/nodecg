# Template

[![NPM version](https://img.shields.io/npm/v/@blakeembrey/template.svg?style=flat)](https://npmjs.org/package/@blakeembrey/template)
[![NPM downloads](https://img.shields.io/npm/dm/@blakeembrey/template.svg?style=flat)](https://npmjs.org/package/@blakeembrey/template)
[![Build status](https://img.shields.io/github/actions/workflow/status/blakeembrey/js-template/ci.yml?branch=main)](https://github.com/blakeembrey/js-template/actions/workflows/ci.yml?query=branch%3Amain)
[![Test coverage](https://img.shields.io/coveralls/blakeembrey/js-template.svg?style=flat)](https://coveralls.io/r/blakeembrey/js-template?branch=master)

> Fast and simple string template library.

## Installation

```
npm install @blakeembrey/template --save
```

## Usage

```js
import { template } from "@blakeembrey/template";

const fn = template("Hello {{name}}!");

fn({ name: "Blake" }); //=> "Hello Blake!"
```

## TypeScript

This module uses [TypeScript](https://github.com/Microsoft/TypeScript) and publishes type definitions on NPM.

## License

Apache 2.0
