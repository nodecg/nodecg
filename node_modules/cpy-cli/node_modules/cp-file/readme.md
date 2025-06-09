# cp-file

> Copy a file

## Highlights

- Fast by using streams in the async version and [`fs.copyFileSync()`](https://nodejs.org/api/fs.html#fs_fs_copyfilesync_src_dest_flags) in the synchronous version.
- Resilient by using [graceful-fs](https://github.com/isaacs/node-graceful-fs).
- User-friendly by creating non-existent destination directories for you.
- Can be safe by turning off [overwriting](#optionsoverwrite).
- Preserves file mode, [but not ownership](https://github.com/sindresorhus/cp-file/issues/22#issuecomment-502079547).
- User-friendly errors.

## Install

```sh
npm install cp-file
```

## Usage

```js
import {copyFile} from 'cp-file';

await copyFile('source/unicorn.png', 'destination/unicorn.png');
console.log('File copied');
```

## API

### copyFile(source, destination, options?)

Returns a `Promise` that resolves when the file is copied.

### copyFileSync(source, destination, options?)

#### source

Type: `string`

The file you want to copy.

#### destination

Type: `string`

Where you want the file copied.

#### options

Type: `object`

##### overwrite

Type: `boolean`\
Default: `true`

Overwrite existing destination file.

##### cwd

Type: `string`\
Default: `process.cwd()`

The working directory to find source files.

The source and destination path are relative to this.

##### directoryMode

Type: `number`\
Default: `0o777`

[Permissions](https://en.wikipedia.org/wiki/File-system_permissions#Numeric_notation) for created directories.

It has no effect on Windows.

##### onProgress

Type: `(progress: ProgressData) => void`

The given function is called whenever there is measurable progress.

Only available when using the async method.

###### `ProgressData`

```js
{
	sourcePath: string,
	destinationPath: string,
	size: number,
	writtenBytes: number,
	percent: number
}
```

- `sourcePath` and `destinationPath` are absolute paths.
- `size` and `writtenBytes` are in bytes.
- `percent` is a value between `0` and `1`.

###### Notes

- For empty files, the `onProgress` callback function is emitted only once.

```js
import {copyFile} from 'cp-file';

await copyFile(source, destination, {
	onProgress: progress => {
		// …
	}
});
```

## Related

- [cpy](https://github.com/sindresorhus/cpy) - Copy files
- [cpy-cli](https://github.com/sindresorhus/cpy-cli) - Copy files on the command-line
- [move-file](https://github.com/sindresorhus/move-file) - Move a file
- [make-dir](https://github.com/sindresorhus/make-dir) - Make a directory and its parents if needed
