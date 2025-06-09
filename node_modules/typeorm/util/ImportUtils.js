"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importOrRequireFile = importOrRequireFile;
const tslib_1 = require("tslib");
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const path_1 = tslib_1.__importDefault(require("path"));
const url_1 = require("url");
async function importOrRequireFile(filePath) {
    const tryToImport = async () => {
        // `Function` is required to make sure the `import` statement wil stay `import` after
        // transpilation and won't be converted to `require`
        return [
            await Function("return filePath => import(filePath)")()(filePath.startsWith("file://")
                ? filePath
                : (0, url_1.pathToFileURL)(filePath).toString()),
            "esm",
        ];
    };
    const tryToRequire = async () => {
        return [require(filePath), "commonjs"];
    };
    const extension = filePath.substring(filePath.lastIndexOf(".") + ".".length);
    if (extension === "mjs" || extension === "mts")
        return tryToImport();
    else if (extension === "cjs" || extension === "cts")
        return tryToRequire();
    else if (extension === "js" || extension === "ts") {
        const packageJson = await getNearestPackageJson(filePath);
        if (packageJson != null) {
            const isModule = packageJson?.type === "module";
            if (isModule)
                return tryToImport();
            else
                return tryToRequire();
        }
        else
            return tryToRequire();
    }
    return tryToRequire();
}
async function getNearestPackageJson(filePath) {
    let currentPath = filePath;
    while (currentPath !== path_1.default.dirname(currentPath)) {
        currentPath = path_1.default.dirname(currentPath);
        const potentialPackageJson = path_1.default.join(currentPath, "package.json");
        try {
            const stats = await promises_1.default.stat(potentialPackageJson);
            if (!stats.isFile()) {
                continue;
            }
            try {
                return JSON.parse(await promises_1.default.readFile(potentialPackageJson, "utf8"));
            }
            catch {
                return null;
            }
        }
        catch {
            continue;
        }
    }
    // the top of the file tree is reached
    return null;
}

//# sourceMappingURL=ImportUtils.js.map
