var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  copy: () => copy,
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// src/lib/esbuild-plugin-copy.ts
var import_path2 = __toESM(require("path"));
var import_chalk3 = __toESM(require("chalk"));
var import_globby = __toESM(require("globby"));
var import_chokidar = __toESM(require("chokidar"));

// src/lib/handler.ts
var import_path = __toESM(require("path"));
var import_fs_extra = __toESM(require("fs-extra"));
var import_chalk2 = __toESM(require("chalk"));

// src/lib/utils.ts
var import_chalk = __toESM(require("chalk"));
function ensureArray(item) {
  return Array.isArray(item) ? item : [
    item
  ];
}
__name(ensureArray, "ensureArray");
function verboseLog(msg, verbose, lineBefore = false) {
  if (!verbose) {
    return;
  }
  console.log(import_chalk.default.blue(lineBefore ? "\ni" : "i"), msg);
}
__name(verboseLog, "verboseLog");
function formatAssets(assets) {
  return ensureArray(assets).filter((asset) => asset.from && asset.to).map(({ from, to, watch }) => ({
    from: ensureArray(from),
    to: ensureArray(to),
    watch: watch ?? false
  }));
}
__name(formatAssets, "formatAssets");
var PLUGIN_EXECUTED_FLAG = "esbuild_copy_executed";

// src/lib/handler.ts
function copyOperationHandler(outDirResolveFrom, rawFromPath, globbedFromPath, baseToPath, verbose = false, dryRun = false) {
  for (const rawFrom of rawFromPath) {
    const { dir } = import_path.default.parse(rawFrom);
    if (!dir.endsWith("/**")) {
      verboseLog(`The from path ${import_chalk2.default.white(rawFromPath)} of current asset pair doesnot ends with ${import_chalk2.default.white("/**/*(.ext)")}, `, verbose);
    }
    const startFragment = dir.replace(`/**`, "");
    const [, preservedDirStructure] = globbedFromPath.split(startFragment);
    const sourcePath = import_path.default.resolve(globbedFromPath);
    const isToPathDir = import_path.default.extname(baseToPath) === "";
    const composedDistDirPath = isToPathDir ? import_path.default.resolve(
      outDirResolveFrom,
      baseToPath,
      preservedDirStructure.slice(1)
    ) : import_path.default.resolve(
      outDirResolveFrom,
      baseToPath
    );
    dryRun ? void 0 : import_fs_extra.default.ensureDirSync(import_path.default.dirname(composedDistDirPath));
    dryRun ? void 0 : import_fs_extra.default.copyFileSync(sourcePath, composedDistDirPath);
    verboseLog(`${dryRun ? import_chalk2.default.white("[DryRun] ") : ""}File copied: ${import_chalk2.default.white(sourcePath)} -> ${import_chalk2.default.white(composedDistDirPath)}`, verbose);
  }
}
__name(copyOperationHandler, "copyOperationHandler");

// src/lib/esbuild-plugin-copy.ts
var copy = /* @__PURE__ */ __name((options = {}) => {
  const { assets = [], copyOnStart = false, globbyOptions = {}, verbose: _verbose = false, once = false, resolveFrom = "out", dryRun = false, watch: _globalWatchControl = false } = options;
  let globalWatchControl = _globalWatchControl;
  const verbose = dryRun === true || _verbose;
  const formattedAssets = formatAssets(assets);
  const applyHook = copyOnStart ? "onStart" : "onEnd";
  return {
    name: "plugin:copy",
    setup(build) {
      build[applyHook](async () => {
        if (once && process.env[PLUGIN_EXECUTED_FLAG] === "true") {
          verboseLog(`Copy plugin skipped as option ${import_chalk3.default.white("once")} set to true`, verbose);
          return;
        }
        if (!formattedAssets.length) {
          return;
        }
        let outDirResolveFrom;
        if (resolveFrom === "cwd") {
          outDirResolveFrom = process.cwd();
        } else if (resolveFrom === "out") {
          const outDir = build.initialOptions.outdir ?? import_path2.default.dirname(build.initialOptions.outfile);
          if (!outDir) {
            verboseLog(import_chalk3.default.red(`You should provide valid ${import_chalk3.default.white("outdir")} or ${import_chalk3.default.white("outfile")} for assets copy. received outdir:${build.initialOptions.outdir}, received outfile:${build.initialOptions.outfile}`), verbose);
            return;
          }
          outDirResolveFrom = outDir;
        } else {
          outDirResolveFrom = resolveFrom;
        }
        verboseLog(
          `Resolve assert pair to path from: ${import_path2.default.resolve(outDirResolveFrom)}`,
          verbose
        );
        globalWatchControl ? verboseLog(`Watching mode enabled for all asset pairs, you can disable it by set ${import_chalk3.default.white("watch")} to false in specified asset pairs`, verbose) : void 0;
        if (!build.initialOptions.watch) {
          verboseLog(`Watching mode disabled. You need to enable ${import_chalk3.default.white("build.watch")} option for watch mode to work.`, verbose);
          globalWatchControl = false;
        }
        for (const { from, to, watch: localWatchControl } of formattedAssets) {
          const useWatchModeForCurrentAssetPair = globalWatchControl || localWatchControl;
          const pathsCopyFrom = await (0, import_globby.default)(from, {
            expandDirectories: false,
            onlyFiles: true,
            ...globbyOptions
          });
          const deduplicatedPaths = [
            ...new Set(pathsCopyFrom)
          ];
          if (!deduplicatedPaths.length) {
            verboseLog(`No files matched using current glob pattern: ${import_chalk3.default.white(from)}, maybe you need to configure globby by ${import_chalk3.default.white("options.globbyOptions")}?`, verbose);
          }
          const executor = /* @__PURE__ */ __name(() => {
            for (const fromPath of deduplicatedPaths) {
              to.forEach((toPath) => {
                copyOperationHandler(outDirResolveFrom, from, fromPath, toPath, verbose, dryRun);
              });
            }
            process.env[PLUGIN_EXECUTED_FLAG] = "true";
          }, "executor");
          if (useWatchModeForCurrentAssetPair) {
            verboseLog(`Watching mode enabled for current asset pair source: ${import_chalk3.default.white(from)}, files will only be copied again on changes.`, verbose);
            executor();
            const watcher = import_chokidar.default.watch(from, {
              disableGlobbing: false,
              usePolling: true,
              interval: 200,
              ...typeof useWatchModeForCurrentAssetPair === "object" ? useWatchModeForCurrentAssetPair : {}
            });
            watcher.on("change", (fromPath) => {
              verboseLog(`[File Changed] File ${import_chalk3.default.white(fromPath)} changed, copy operation triggered.`, verbose);
              to.forEach((toPath) => {
                copyOperationHandler(outDirResolveFrom, from, fromPath, toPath, verbose, dryRun);
              });
            });
          } else {
            executor();
          }
        }
      });
    }
  };
}, "copy");

// src/index.ts
var src_default = copy;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  copy
});
