# CHANGELOG

## Release 2.1.1

- BugFix: When copy with `file-to-file`, and the `to` path contains nested unexist path, the plugin will throw error as it doesnot create the nested path by `fs.ensureDirSync`.

## Release 2.1.0

- Feature: `Watch Mode` support for plugin-level and asset pair level.

## Released 2.0.1

- BugFix: Update build configuration for better CJS & ESM compat support.

## Released 2.0.0

- **BREAKINGS**: `keepStructure` options was deprecated, and now this plugin will always preserve file structure.
- CHORE: Both CJS and ESM output will be published now, as with `exports` field in packages.json, you will be using the ESM version by `import`, and CJS version by `require`.
