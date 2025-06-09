var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/lib/esbuild-plugin-copy.ts
import path2 from "path";
import chalk3 from "chalk";
import globby from "globby";
import chokidar from "chokidar";

// src/lib/handler.ts
import path from "path";
import fs from "fs-extra";
import chalk2 from "chalk";

// src/lib/utils.ts
import chalk from "chalk";
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
  console.log(chalk.blue(lineBefore ? "\ni" : "i"), msg);
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
    const { dir } = path.parse(rawFrom);
    if (!dir.endsWith("/**")) {
      verboseLog(`The from path ${chalk2.white(rawFromPath)} of current asset pair doesnot ends with ${chalk2.white("/**/*(.ext)")}, `, verbose);
    }
    const startFragment = dir.replace(`/**`, "");
    const [, preservedDirStructure] = globbedFromPath.split(startFragment);
    const sourcePath = path.resolve(globbedFromPath);
    const isToPathDir = path.extname(baseToPath) === "";
    const composedDistDirPath = isToPathDir ? path.resolve(
      outDirResolveFrom,
      baseToPath,
      preservedDirStructure.slice(1)
    ) : path.resolve(
      outDirResolveFrom,
      baseToPath
    );
    dryRun ? void 0 : fs.ensureDirSync(path.dirname(composedDistDirPath));
    dryRun ? void 0 : fs.copyFileSync(sourcePath, composedDistDirPath);
    verboseLog(`${dryRun ? chalk2.white("[DryRun] ") : ""}File copied: ${chalk2.white(sourcePath)} -> ${chalk2.white(composedDistDirPath)}`, verbose);
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
          verboseLog(`Copy plugin skipped as option ${chalk3.white("once")} set to true`, verbose);
          return;
        }
        if (!formattedAssets.length) {
          return;
        }
        let outDirResolveFrom;
        if (resolveFrom === "cwd") {
          outDirResolveFrom = process.cwd();
        } else if (resolveFrom === "out") {
          const outDir = build.initialOptions.outdir ?? path2.dirname(build.initialOptions.outfile);
          if (!outDir) {
            verboseLog(chalk3.red(`You should provide valid ${chalk3.white("outdir")} or ${chalk3.white("outfile")} for assets copy. received outdir:${build.initialOptions.outdir}, received outfile:${build.initialOptions.outfile}`), verbose);
            return;
          }
          outDirResolveFrom = outDir;
        } else {
          outDirResolveFrom = resolveFrom;
        }
        verboseLog(
          `Resolve assert pair to path from: ${path2.resolve(outDirResolveFrom)}`,
          verbose
        );
        globalWatchControl ? verboseLog(`Watching mode enabled for all asset pairs, you can disable it by set ${chalk3.white("watch")} to false in specified asset pairs`, verbose) : void 0;
        if (!build.initialOptions.watch) {
          verboseLog(`Watching mode disabled. You need to enable ${chalk3.white("build.watch")} option for watch mode to work.`, verbose);
          globalWatchControl = false;
        }
        for (const { from, to, watch: localWatchControl } of formattedAssets) {
          const useWatchModeForCurrentAssetPair = globalWatchControl || localWatchControl;
          const pathsCopyFrom = await globby(from, {
            expandDirectories: false,
            onlyFiles: true,
            ...globbyOptions
          });
          const deduplicatedPaths = [
            ...new Set(pathsCopyFrom)
          ];
          if (!deduplicatedPaths.length) {
            verboseLog(`No files matched using current glob pattern: ${chalk3.white(from)}, maybe you need to configure globby by ${chalk3.white("options.globbyOptions")}?`, verbose);
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
            verboseLog(`Watching mode enabled for current asset pair source: ${chalk3.white(from)}, files will only be copied again on changes.`, verbose);
            executor();
            const watcher = chokidar.watch(from, {
              disableGlobbing: false,
              usePolling: true,
              interval: 200,
              ...typeof useWatchModeForCurrentAssetPair === "object" ? useWatchModeForCurrentAssetPair : {}
            });
            watcher.on("change", (fromPath) => {
              verboseLog(`[File Changed] File ${chalk3.white(fromPath)} changed, copy operation triggered.`, verbose);
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
export {
  copy,
  src_default as default
};
