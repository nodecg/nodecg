"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationCreateCommand = void 0;
const tslib_1 = require("tslib");
const ansis_1 = tslib_1.__importDefault(require("ansis"));
const path_1 = tslib_1.__importDefault(require("path"));
const PlatformTools_1 = require("../platform/PlatformTools");
const StringUtils_1 = require("../util/StringUtils");
const CommandUtils_1 = require("./CommandUtils");
/**
 * Creates a new migration file.
 */
class MigrationCreateCommand {
    constructor() {
        this.command = "migration:create <path>";
        this.describe = "Creates a new migration file.";
    }
    builder(args) {
        return args
            .positional("path", {
            type: "string",
            describe: "Path of the migration file",
            demandOption: true,
        })
            .option("o", {
            alias: "outputJs",
            type: "boolean",
            default: false,
            describe: "Generate a migration file on Javascript instead of Typescript",
        })
            .option("esm", {
            type: "boolean",
            default: false,
            describe: "Generate a migration file on ESM instead of CommonJS",
        })
            .option("t", {
            alias: "timestamp",
            type: "number",
            default: false,
            describe: "Custom timestamp for the migration name",
        });
    }
    async handler(args) {
        try {
            const timestamp = CommandUtils_1.CommandUtils.getTimestamp(args.timestamp);
            const inputPath = args.path.startsWith("/")
                ? args.path
                : path_1.default.resolve(process.cwd(), args.path);
            const filename = path_1.default.basename(inputPath);
            const fullPath = path_1.default.dirname(inputPath) + "/" + timestamp + "-" + filename;
            const fileContent = args.outputJs
                ? MigrationCreateCommand.getJavascriptTemplate(filename, timestamp, args.esm)
                : MigrationCreateCommand.getTemplate(filename, timestamp);
            await CommandUtils_1.CommandUtils.createFile(fullPath + (args.outputJs ? ".js" : ".ts"), fileContent);
            console.log(`Migration ${ansis_1.default.blue(fullPath + (args.outputJs ? ".js" : ".ts"))} has been generated successfully.`);
        }
        catch (err) {
            PlatformTools_1.PlatformTools.logCmdErr("Error during migration creation:", err);
            process.exit(1);
        }
    }
    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------
    /**
     * Gets contents of the migration file.
     */
    static getTemplate(name, timestamp) {
        return `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${(0, StringUtils_1.camelCase)(name, true)}${timestamp} implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
`;
    }
    /**
     * Gets contents of the migration file in Javascript.
     */
    static getJavascriptTemplate(name, timestamp, esm) {
        const exportMethod = esm ? "export" : "module.exports =";
        return `/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
${exportMethod} class ${(0, StringUtils_1.camelCase)(name, true)}${timestamp} {

    async up(queryRunner) {
    }

    async down(queryRunner) {
    }

}
`;
    }
}
exports.MigrationCreateCommand = MigrationCreateCommand;

//# sourceMappingURL=MigrationCreateCommand.js.map
