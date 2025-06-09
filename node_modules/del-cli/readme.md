# del-cli

> Delete files and directories

Useful for use in build scripts and automated things.

*Note that this does permanent deletion. See [`trash-cli`](https://github.com/sindresorhus/trash-cli) for something safer.*

## Install

```sh
npm install --global del-cli
```

## Usage

```
$ del --help

  Usage
    $ del <path|glob> …

  Options
    --force, -f    Allow deleting the current working directory and outside
    --dry-run, -d  List what would be deleted instead of deleting
    --verbose, -v  Display the absolute path of files and directories as they are deleted

  Examples
    $ del unicorn.png rainbow.png
    $ del "*.png" "!unicorn.png"
```

> :warning: **Windows users**: Since `$ del` is already a builtin command on Windows, you need to use `$ del-cli` there.

## Comparison

Benefits over `rimraf` CLI: Supports globbing (even on Windows), safer by default as it doesn't allow deleting parent directories, and has a dry-run mode.

Benefits over `rm -rf`: Cross-platform, safer by default as it doesn't allow deleting parent directories, and has a dry-run mode.

## Related

- [del](https://github.com/sindresorhus/del) - API for this module
- [trash-cli](https://github.com/sindresorhus/trash-cli) - Move files and directories to the trash
- [make-dir-cli](https://github.com/sindresorhus/make-dir-cli) - Make directories and their parents if needed
