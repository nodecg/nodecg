import ansi from "ansis";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { highlight } from "sql-highlight";
import { format as sqlFormat } from "@sqltools/formatter";
export { EventEmitter } from "events";
export { ReadStream } from "fs";
export { Readable, Writable } from "stream";
/**
 * Platform-specific tools.
 */
export class PlatformTools {
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
            return require(path.resolve(process.cwd() + "/node_modules/" + name));
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
        let normalizedPath = path.normalize(pathStr);
        if (process.platform === "win32")
            normalizedPath = normalizedPath.replace(/\\/g, "/");
        return normalizedPath;
    }
    /**
     * Gets file extension. Does "path.extname".
     */
    static pathExtname(pathStr) {
        return path.extname(pathStr);
    }
    /**
     * Resolved given path. Does "path.resolve".
     */
    static pathResolve(pathStr) {
        return path.resolve(pathStr);
    }
    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    static fileExist(pathStr) {
        return fs.existsSync(pathStr);
    }
    static readFileSync(filename) {
        return fs.readFileSync(filename);
    }
    static appendFileSync(filename, data) {
        fs.appendFileSync(filename, data);
    }
    static async writeFile(path, data) {
        return fs.promises.writeFile(path, data);
    }
    /**
     * Loads a dotenv file into the environment variables.
     *
     * @param path The file to load as a dotenv configuration
     */
    static dotenv(pathStr) {
        dotenv.config({ path: pathStr });
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
        return highlight(sql, {
            colors: {
                keyword: ansi.blueBright.open,
                function: ansi.magentaBright.open,
                number: ansi.green.open,
                string: ansi.white.open,
                identifier: ansi.white.open,
                special: ansi.white.open,
                bracket: ansi.white.open,
                comment: ansi.gray.open,
                clear: ansi.reset.open,
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
        return sqlFormat(sql, {
            language: databaseLanguage,
            indent: "    ",
        });
    }
    /**
     * Logging functions needed by AdvancedConsoleLogger
     */
    static logInfo(prefix, info) {
        console.log(ansi.gray.underline(prefix), info);
    }
    static logError(prefix, error) {
        console.log(ansi.underline.red(prefix), error);
    }
    static logWarn(prefix, warning) {
        console.log(ansi.underline.yellow(prefix), warning);
    }
    static log(message) {
        console.log(ansi.underline(message));
    }
    static info(info) {
        return ansi.gray(info);
    }
    static error(error) {
        return ansi.red(error);
    }
    static warn(message) {
        return ansi.yellow(message);
    }
    static logCmdErr(prefix, err) {
        console.log(ansi.black.bgRed(prefix));
        if (err)
            console.error(err);
    }
}
/**
 * Type of the currently running platform.
 */
PlatformTools.type = "node";

//# sourceMappingURL=PlatformTools.js.map
