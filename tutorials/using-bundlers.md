If you don't know why you should use bundlers, read up
[Why webpack](https://webpack.js.org/concepts/why-webpack/).

There are currently three JavaScript bundlers.

- [webpack](https://github.com/webpack/webpack)
  - By far the most used bundler with a lot of community made extensions
- [rollup](https://github.com/rollup/rollup)
  - Primarily used by libraries like React, Vue
- [parcel](https://github.com/parcel-bundler/parcel)
  - New bundler famous for zero-config, and super fast building process

These bundlers allows you to

- write modular, organised source code
- treat CSS, images, or any sort of files like JavaScript module
- use npm packages for front-end (dashboard/graphics)
- use JSX/TSX, Vue single file component
- write in other languages like TypeScript
- and many more

This tutorial goes through the setup using parcel.

## Directory Structure

Basically you will have parcel to output the whole `dashboard` and `graphics`
directory. Your project would look like this

```
foo-layouts
|- extension
|- schemas
|- src
|- package.json
```

When you run parcel, it will make `dashboard` and `graphics` directory and
output bundle result into them.

(After running parcel)
```
foo-layouts
|- extension
|- schemas
|- src
|- package.json
|- dashboard (built)
  |- index.html
  |- styles.8jx17sx.css
  |- main.7x2hdjs.js
|- graphics (built)
  |- ds1.html
  |- sd1.html
  |- styles.03nsh2s.css
  |- ds1.rssiahs.js
  |- sd1.4jc71nx.js
  |- background.d8frsis.png
```

The random string for each generated files are automatically generated to
refresh cache when the files change.

## Setup

As I said, parcel is (literally) zero-configuration required. It even installs
missing packages for you if there is any.

### Add parcel to your bundle

#### Locally

```sh
npm install --save-dev parcel-bundler
# or
yarn add -D parcel-bundler
```

The `parcel` command will be available locally. You can run it either adding
npm scripts, or `npx parcel`/`yarn parcel`.

#### Globally

```sh
npm install -g parcel-bundler
# or
yarn global add parcel-bundler
```

With this, `parcel` command should be available globally. Just run `parcel` to
run the bundler.

### Make an entrypoint

When building front-end, HTML file is usually used as entrypoint. It would look
like this.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="./styles.css">
  </head>

  <body>
    <div id="tech"></div>
    <!-- Or a lot of pre-defined elements -->
    <script src="./index.js"></script>
  </body>
</html>
```

This HTML file will also be compiled in the bundler. So you can many kind of
files in the `script` tag. Parcel will automatically detect file format and use
appropriate library/compiler to bundle the file.

```html
<script src="./main.coffee"></script>
```

```html
<script src="./app.tsx"></script>
```

Or the entrypoint isn't even have to be an HTML file. For example, you can use
Pug to have common parts of HTML file into one file.

```pug
doctype html
html
  head
    title graphics-ds
    include lib/common.pug
  body
    div(id="ds")
    script(src="./views/ds.ts")
```

### Run the command

That's it! Now all you have to do is run the magic command.

For development, with file change detection and hot-reloading:

```sh
parcel watch src/dashboard/index.html --out-dir dashboard --public-url ./
```

For production build, with optimized output:

```sh
parcel build src/dashboard/index.html --out-dir dashboard --public-url ./
```

(Replace `src/dashboard/index.html` with your entrypoint files.)

You can use glob pattern to use multiple entrypoints, if you have multiple pages
to compile

```sh
parcel build src/graphics/*.html --out-dir dashboard --public-url ./
```

Details described in [the reference](https://parceljs.org/cli.html).

### Recommended Configuration

Even though it already works for most cases (!), a bit of configuration might be
recommended/required.

#### browserslist

Parcel uses [babel](https://babeljs.io/) out of box, and the default supported
browsers are `>0.25%` which includes old browsers like IE.

Considering how NodeCG is used, it's the best to target only modern browsers or
just Chrome. To do so, add `browserslist` property to `package.json`.

For example,

```json
{
  // ...
  "browserslist": "last 2 chrome versions",
  "nodecg": //...
}
```

Refer to [this page](https://github.com/browserslist/browserslist#full-list) for
detailed `browserslist` syntax.

### Going further

Due to the huge amount of features parcel offers out of box, at this point you
already have a lot more options for your front-end development. For example:

- React development with JSX/TSX
- Vue single file component
- TypeScript or other alternative languages

Also, if your project becomes too advanced for parcel to handle, you can switch
to webpack. It produces a bit more optimized code, and has a lot more features
supported.
