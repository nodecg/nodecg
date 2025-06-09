# sql-highlight
> A simple and lightweight library for highlighting SQL queries written in pure
> JavaScript

[![Tests Status][tests-badge]][tests-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![NPM Version][npm-version-badge]][npm-url]
[![Bundle Size][bundlejs-badge]][bundlejs-url]

## What's it all about?
sql-highlight is a small package that highlights SQL queries. It can output to
both the terminal with Unicode escape sequences, as well as to normal HTML. Oh,
and there are no external dependencies 😉

## Installation

sql-highlight is tested to work with Node.js 16, 18, 20 and 22.

Install with Yarn:
```bash
yarn add sql-highlight
```
Install with NPM:
```bash
npm install sql-highlight
```

## Usage

**In its most basic form:**
```js
const { highlight } = require('sql-highlight')

const sqlString = "SELECT `id`, `username` FROM `users` WHERE `email` = 'test@example.com'"

const highlighted = highlight(sqlString)

console.log(highlighted)
```

**Output:**

![Screenshot](screenshot.png)

**HTML mode:**

```js
const { highlight } = require('sql-highlight')

const sqlString = "SELECT `id`, `username` FROM `users` WHERE `email` = 'test@example.com'"

const highlighted = highlight(sqlString, {
  html: true
})

document.body.innerHTML += highlighted
```

**Output:**
```html
<span class="sql-hl-keyword">SELECT</span>
<span class="sql-hl-identifier">`id`</span>
<span class="sql-hl-special">,</span>
<span class="sql-hl-identifier">`username`</span>
<span class="sql-hl-keyword">FROM</span>
<span class="sql-hl-identifier">`users`</span>
<span class="sql-hl-keyword">WHERE</span>
<span class="sql-hl-identifier">`email`</span>
<span class="sql-hl-special">=</span>
<span class="sql-hl-string">'test@example.com'</span>
```

## Options
The following options may be passed to the `highlight` function.

| Option | Value | Default | Description |
| --- | --- | --- | --- |
| html | `boolean` | `false` | Set to true to render HTML instead of Unicode.
| htmlEscaper | `(str: string) => string` | Basic escaper | Function to escape HTML entities. Uses a basic escaper by default. If HTML mode is used in a browser environment this could be useful to escape strings using the DOM.
| classPrefix | `string` | `'sql-hl-'` | Prefix to prepend to classes for HTML span-tags. Is appended with entity name.
| colors | `Object` | _See below_* | What color codes to use for Unicode rendering. A list of basic color codes can be found [here](https://docs.rs/embedded-text/0.4.0/embedded_text/style/index.html#standard-color-codes).

\* `colors` option default value
```js
{
  keyword: '\x1b[35m',  // SQL reserved keywords
  function: '\x1b[31m', // Functions
  number: '\x1b[32m',   // Numbers
  string: '\x1b[32m',   // Strings
  special: '\x1b[33m',  // Special characters
  bracket: '\x1b[33m',  // Brackets (parentheses)
  comment: '\x1b[2m\x1b[90m', // Comments
  clear: '\x1b[0m'      // Clear (inserted after each match)
}
```

## Custom highlighting

In case you want to do the highlighting yourself you can use `getSegments` to only let sql-highlight parse the SQL string for you. You can then use the segments to highlight it yourself.

```js
const { getSegments } = require('sql-highlight')

const sqlString = "SELECT `id`, `username` FROM `users` WHERE `email` = 'test@example.com'"

const segments = getSegments(sqlString)

console.log(segments)
```

**Output:**
```js
[
    { name: 'keyword', content: 'SELECT' },
    { name: 'whitespace', content: ' ' },
    { name: 'identifier', content: '`id`' },
    { name: 'special', content: ',' },
    { name: 'whitespace', content: ' ' },
    { name: 'identifier', content: '`username`' },
    { name: 'whitespace', content: ' ' },
    { name: 'keyword', content: 'FROM' },
    { name: 'whitespace', content: ' ' },
    { name: 'identifier', content: '`users`' },
    { name: 'whitespace', content: ' ' },
    { name: 'keyword', content: 'WHERE' },
    { name: 'whitespace', content: ' ' },
    { name: 'identifier', content: '`email`' },
    { name: 'whitespace', content: ' ' },
    { name: 'special', content: '=' },
    { name: 'whitespace', content: ' ' },
    { name: 'string', content: "'test@example.com'" }
]
```

## Contributing

See the [contribution guidelines](CONTRIBUTING.md).

## Tests

We use [Jest](https://jestjs.io/) for running our tests. The test suite can be run by running `npm run test`. This will run both Jest and Biome.

## Code style

We use [Biome](https://biomejs.dev/) for making sure that our code remains pretty and consistent throughout the project. If your editor doesn't automatically pick up our config you can lint the code using `npm run lint`.

## A note on Dependabot

[Dependabot Auto
Merge](https://github.com/marketplace/actions/dependabot-auto-merge) is
installed in this repository to automatically merge dependabot PRs for minor
version updates. Only PRs that pass the tests get merged. No new releases will
be created for dependency updates as there are no production dependencies and a
release would therefore be completely unnecessary.

## Additional information

Malcolm Nihlén - malcolm.nihlen@gmail.com

Distributed under the MIT licence. See `LICENCE` for more information.

https://github.com/scriptcoded

## Disclaimer
This was initially a fork from https://github.com/pomahtuk/sequilize-highlight.
The repo wasn't being updated, NPM wasn't serving the latest version and there
was a severe memory leak. Though the latest version now exists on NPM, issues
still persist. This repo serves to address those problems, as well as providing
a cleaner interface that's not bound to Sequelize.

With version 3.0.0 the library was almost completely rewritten, which leaves
very little similarity with the original repo.

[tests-badge]: https://img.shields.io/github/actions/workflow/status/scriptcoded/sql-highlight/test.yml?branch=main&label=tests
[tests-url]: https://github.com/scriptcoded/sql-highlight/actions/workflows/test.yml
[coveralls-badge]: https://coveralls.io/repos/github/scriptcoded/sql-highlight/badge.svg
[coveralls-url]: https://coveralls.io/github/scriptcoded/sql-highlight
[npm-version-badge]: https://img.shields.io/npm/v/sql-highlight.svg
[npm-url]: https://npmjs.org/package/sql-highlight
[bundlejs-badge]: https://deno.bundlejs.com/?bundle&q=sql-highlight&badge
[bundlejs-url]: https://bundlejs.com/?bundle&q=sql-highlight
