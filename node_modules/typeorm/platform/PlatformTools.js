"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformTools = exports.Writable = exports.Readable = exports.ReadStream = exports.EventEmitter = void 0;
const tslib_1 = require("tslib");
const ansis_1 = tslib_1.__importDefault(require("ansis"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const sql_highlight_1 = require("sql-highlight");
const formatter_1 = require("@sqltools/formatter");
var events_1 = require("events");
Object.defineProperty(exports, "EventEmitter", { enumerable: true, get: function () { return events_1.EventEmitter; } });
var fs_2 = require("fs");
Object.defineProperty(exports, "ReadStream", { enumerable: true, get: function () { return fs_2.ReadStream; } });
var stream_1 = require("stream");
Object.defineProperty(exports, "Readable", { enumerable: true, get: function () { return stream_1.Readable; } });
Object.defineProperty(exports, "Writable", { enumerable: true, get: function () { return stream_1.Writable; } });
/**
 * Platform-specific tools.
 */
class PlatformTools {
    /**
     * Gets global variable where global stuff can be stored.
     */
    static getGlobalVariable() {
        return global;
    }
    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    static load(name) {
        // if name is not absolute or relative, then try to load package from the node_modules of the directory we are currently in
        // this is useful when we are using typeorm package globally installed and it accesses drivers
        // that are not installed globally
        try {
            // switch case to explicit require statements for webpack compatibility.
            switch (name) {
                /**
                 * spanner
                 */
                case "spanner":
                    return require("@google-cloud/spanner");
                /**
                 * mongodb
                 */
                case "mongodb":
                    return require("mongodb");
                /**
                 * hana
                 */
                case "@sap/hana-client":
                    return require("@sap/hana-client");
                case "@sap/hana-client/extension/Stream":
                    return require("@sap/hana-client/extension/Stream");
                case "hdb-pool":
                    return require("hdb-pool");
                /**
                 * mysql
                 */
                case "mysql":
                    return require("mysql");
                case "mysql2":
                    return require("mysql2");
                /**
                 * oracle
                 */
                case "oracledb":
                    return require("oracledb");
                /**
                 * postgres
                 */
                case "pg":
                    return require("pg");
                case "pg-native":
                    return require("pg-native");
                case "pg-query-stream":
                    return require("pg-query-stream");
                case "typeorm-aurora-data-api-driver":
                    return require("typeorm-aurora-data-api-driver");
                /**
                 * redis
                 */
                case "redis":
                    return require("redis");
                case "ioredis":
                    return require("ioredis");
                /**
                 * better-sqlite3
                 */
                case "better-sqlite3":
                    return require("better-sqlite3");
                /**
                 * sqlite
                 */
                case "sqlite3":
                    return require("sqlite3");
                /**
                 * sql.js
                 */
                case "sql.js":
                    return require("sql.js");
                /**
                 * sqlserver
                 */
                case "mssql":
                    return require("mssql");
                /**
                 * react-native-sqlite
                 */
                case "react-native-sqlite-storage":
                    return require("react-native-sqlite-storage");
            }
        }
        catch (err) {
            return require(path_1.default.resolve(process.cwd() + "/node_modules/" + name));
        }
        // If nothing above matched and we get here, the package was not listed within PlatformTools
        // and is an Invalid Package.  To make it explicit that this is NOT the intended use case for
        // PlatformTools.load - it's not just a way to replace `require` all willy-nilly - let's throw
        // an error.
        throw new TypeError(`Invalid Package for PlatformTools.load: ${name}`);
    }
    /**
     * Normalizes given path. Does "path.normalize" and replaces backslashes with forward slashes on Windows.
     */
    static pathNormalize(pathStr) {
        let normalizedPath = path_1.default.normalize(pathStr);
        if (process.platform === "win32")
            normalizedPath = normalizedPath.replace(/\\/g, "/");
        return normalizedPath;
    }
    /**
     * Gets file extension. Does "path.extname".
     */
    static pathExtname(pathStr) {
        return path_1.default.extname(pathStr);
    }
    /**
     * Resolved given path. Does "path.resolve".
     */
    static pathResolve(pathStr) {
        return path_1.default.resolve(pathStr);
    }
    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    static fileExist(pathStr) {
        return fs_1.default.existsSync(pathStr);
    }
    static readFileSync(filename) {
        return fs_1.default.readFileSync(filename);
    }
    static appendFileSync(filename, data) {
        fs_1.default.appendFileSync(filename, data);
    }
    static async writeFile(path, data) {
        return fs_1.default.promises.writeFile(path, data);
    }
    /**
     * Loads a dotenv file into the environment variables.
     *
     * @param path The file to load as a dotenv configuration
     */
    static dotenv(pathStr) {
        dotenv_1.default.config({ path: pathStr });
    }
    /**
     * Gets environment variable.
     */
    static getEnvVariable(name) {
        return process.env[name];
    }
    /**
     * Highlights sql string to be printed in the console.
     */
    static highlightSql(sql) {
        return (0, sql_highlight_1.highlight)(sql, {
            colors: {
                keyword: ansis_1.default.blueBright.open,
                function: ansis_1.default.magentaBright.open,
                number: ansis_1.default.green.open,
                string: ansis_1.default.white.open,
                identifier: ansis_1.default.white.open,
                special: ansis_1.default.white.open,
                bracket: ansis_1.default.white.open,
                comment: ansis_1.default.gray.open,
                clear: ansis_1.default.reset.open,
            },
        });
    }
    /**
     * Pretty-print sql string to be print in the console.
     */
    static formatSql(sql, dataSourceType) {
        const databaseLanguageMap = {
            oracle: "pl/sql",
        };
        const databaseLanguage = dataSourceType
            ? databaseLanguageMap[dataSourceType] || "sql"
            : "sql";
        return (0, formatter_1.format)(sql, {
            language: databaseLanguage,
            indent: "    ",
        });
    }
    /**
     * Logging functions needed by AdvancedConsoleLogger
     */
    static logInfo(prefix, info) {
        console.log(ansis_1.default.gray.underline(prefix), info);
    }
    static logError(prefix, error) {
        console.log(ansis_1.default.underline.red(prefix), error);
    }
    static logWarn(prefix, warning) {
        console.log(ansis_1.default.underline.yellow(prefix), warning);
    }
    static log(message) {
        console.log(ansis_1.default.underline(message));
    }
    static info(info) {
        return ansis_1.default.gray(info);
    }
    static error(error) {
        return ansis_1.default.red(error);
    }
    static warn(message) {
        return ansis_1.default.yellow(message);
    }
    static logCmdErr(prefix, err) {
        console.log(ansis_1.default.black.bgRed(prefix));
        if (err)
            console.error(err);
    }
}
exports.PlatformTools = PlatformTools;
/**
 * Type of the currently running platform.
 */
PlatformTools.type = "node";

//# sourceMappingURL=PlatformTools.js.map
