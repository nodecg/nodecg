"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandUtils = void 0;
const tslib_1 = require("tslib");
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const path_1 = tslib_1.__importDefault(require("path"));
const error_1 = require("../error");
const InstanceChecker_1 = require("../util/InstanceChecker");
const ImportUtils_1 = require("../util/ImportUtils");
/**
 * Command line utils functions.
 */
class CommandUtils {
    static async loadDataSource(dataSourceFilePath) {
        let dataSourceFileExports;
        try {
            ;
            [dataSourceFileExports] = await (0, ImportUtils_1.importOrRequireFile)(dataSourceFilePath);
        }
        catch (err) {
            throw new Error(`Unable to open file: "${dataSourceFilePath}". ${err.message}`);
        }
        if (!dataSourceFileExports ||
            typeof dataSourceFileExports !== "object") {
            throw new Error(`Given data source file must contain export of a DataSource instance`);
        }
        if (InstanceChecker_1.InstanceChecker.isDataSource(dataSourceFileExports)) {
            return dataSourceFileExports;
        }
        const dataSourceExports = [];
        for (const fileExportKey in dataSourceFileExports) {
            const fileExport = dataSourceFileExports[fileExportKey];
            // It is necessary to await here in case of the exported async value (Promise<DataSource>).
            // e.g. the DataSource is instantiated with an async factory in the source file
            // It is safe to await regardless of the export being async or not due to `awaits` definition:
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#return_value
            const awaitedFileExport = await fileExport;
            if (InstanceChecker_1.InstanceChecker.isDataSource(awaitedFileExport)) {
                dataSourceExports.push(awaitedFileExport);
            }
        }
        if (dataSourceExports.length === 0) {
            throw new Error(`Given data source file must contain export of a DataSource instance`);
        }
        if (dataSourceExports.length > 1) {
            throw new Error(`Given data source file must contain only one export of DataSource instance`);
        }
        return dataSourceExports[0];
    }
    /**
     * Creates directories recursively.
     */
    static async createDirectories(directory) {
        await promises_1.default.mkdir(directory, { recursive: true });
    }
    /**
     * Creates a file with the given content in the given path.
     */
    static async createFile(filePath, content, override = true) {
        await CommandUtils.createDirectories(path_1.default.dirname(filePath));
        if (override === false && (await CommandUtils.fileExists(filePath))) {
            return;
        }
        await promises_1.default.writeFile(filePath, content);
    }
    /**
     * Reads everything from a given file and returns its content as a string.
     */
    static async readFile(filePath) {
        const file = await promises_1.default.readFile(filePath);
        return file.toString();
    }
    static async fileExists(filePath) {
        try {
            await promises_1.default.access(filePath, promises_1.default.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Gets migration timestamp and validates argument (if sent)
     */
    static getTimestamp(timestampOptionArgument) {
        if (timestampOptionArgument &&
            (isNaN(timestampOptionArgument) || timestampOptionArgument < 0)) {
            throw new error_1.TypeORMError(`timestamp option should be a non-negative number. received: ${timestampOptionArgument}`);
        }
        return timestampOptionArgument
            ? new Date(Number(timestampOptionArgument)).getTime()
            : Date.now();
    }
}
exports.CommandUtils = CommandUtils;

//# sourceMappingURL=CommandUtils.js.map
