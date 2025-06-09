# onchange

Use glob patterns to watch file sets and run a command when anything is added, changed or deleted.

## Install

```sh
npm install onchange
```

## Usage

```sh
# On every change run `npm test`.
onchange 'app/**/*.js' 'test/**/*.js' -- npm test

# On every change restart `server.js` (by killing the running process).
onchange -i -k '**/*.js' -- node server.js

# On every change `echo` file change.
onchange '**/*.js' -- echo '{{event}} to {{file}}'
```

NOTE: Windows users may need to use double quotes rather than single quotes. If used in an npm script, remember to escape the double quotes.

You can match as many glob patterns as you like, just put the command you want to run after the `--` and it will run any time a file matching any of the globs is added changed or deleted.

Other available replacement variables are `fileExt`
(`path.extname(file)`), `fileBase` (`path.basename(file)`),
`fileBaseNoExt` (basename, without extension), and `fileDir`
(`path.dirname(file)`).

## Options

### Add (`-a`, `--add`)

To execute the command for all initially added paths:

```sh
onchange -a 'config.json' -- microservice-proxy -c {{file}} -p 9000
```

### Initial (`-i`, `--initial`)

To execute the command once on load without any event:

```sh
onchange -i '**/*.js' -- npm start
```

### Exclude (`-e`, `--exclude`)

To exclude matches:

```sh
onchange '**/*.ts' -e 'dist/**/*.js' -- tslint
```

### No Exclude (`--no-exclude`)

`**/node_modules/**` and `**/.git/**` are excluded by default, use `--no-exclude` to disable:

```sh
onchange 'node_modules/**' --no-exclude -- tslint
```

### Exclude Path (`--exclude-path`)

Excludes all paths in a file following the [`.gitignore`](https://git-scm.com/docs/gitignore) specification.

```sh
onchange '**' --exclude-path .gitignore -- prettier
```

### Kill (`-k`, `--kill`)

To kill current and pending processes between changes:

```sh
onchange -k '**/*.js' -- npm test
```

### Jobs (`-j <n>`, `--jobs <n>`)

Set the maximum concurrent processes to run (default is `1`):

```sh
onchange -j2 '**/*.js' -- cp -v -r '{{file}}' 'test/{{file}}'
```

### Delay (`-d`, `--delay`)

To set the amount of delay (in ms) between process changes:

```sh
onchange -d 1000 '**/*.js' -- npm start
```

### Await Write Finish (`--await-write-finish <ms>`)

To hold the events until the size does not change for a configurable amount of time (in ms, default is [`2000`](https://www.npmjs.com/package/chokidar#performance)):

```sh
onchange --await-write-finish 1500 '**/*.js' -- npm test
```

### Poll (`-p <ms>`, `--poll <ms>`)

Use polling to monitor for changes. This option is useful if you're watching an NFS volume.

```sh
onchange -p 100 '**/*.js' -- npm test
```

### Outpipe (`-o`, `--outpipe`)

Shell command to execute every change:

```sh
onchange -o '> .changelog' 'src/**/*.js' -- echo '{{event}} to {{file}}'
```

**P.S.** When a command is used with `--outpipe`, the `stdout` from the command will be piped into `outpipe`.

### Filter (`-f`, `--filter`)

By default, onchange watches for all events from [chokidar](https://github.com/paulmillr/chokidar#methods--events). Use
this option to watch only for events you need:

```sh
onchange -f add -f change '**/*.js' -- npm start
```

### Verbose (`-v`, `--verbose`)

Enable if you want verbose logging from `onchange` (useful for debugging). For example:

```sh
onchange -v 'app/**/*.js' 'test/**/*.js' -- npm test
```

## TypeScript

Includes [types](index.d.ts) for TypeScript users.

## Related

- [cli-error-notifier](https://github.com/micromata/cli-error-notifier) - Send native desktop notifications if a command exits with an exit code other than `0`.

## License

MIT
