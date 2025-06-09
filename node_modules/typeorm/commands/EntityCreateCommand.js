"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityCreateCommand = void 0;
const tslib_1 = require("tslib");
const ansis_1 = tslib_1.__importDefault(require("ansis"));
const path_1 = tslib_1.__importDefault(require("path"));
const PlatformTools_1 = require("../platform/PlatformTools");
const CommandUtils_1 = require("./CommandUtils");
/**
 * Generates a new entity.
 */
class EntityCreateCommand {
    constructor() {
        this.command = "entity:create <path>";
        this.describe = "Generates a new entity.";
    }
    builder(args) {
        return args.positional("path", {
            type: "string",
            describe: "Path of the entity file",
            demandOption: true,
        });
    }
    async handler(args) {
        try {
            const fullPath = args.path.startsWith("/")
                ? args.path
                : path_1.default.resolve(process.cwd(), args.path);
            const filename = path_1.default.basename(fullPath);
            const fileContent = EntityCreateCommand.getTemplate(filename);
            const fileExists = await CommandUtils_1.CommandUtils.fileExists(fullPath + ".ts");
            if (fileExists) {
                throw new Error(`File "${fullPath}.ts" already exists`);
            }
            await CommandUtils_1.CommandUtils.createFile(fullPath + ".ts", fileContent);
            console.log(ansis_1.default.green `Entity ${ansis_1.default.blue `${fullPath}.ts`} has been created successfully.`);
        }
        catch (error) {
            PlatformTools_1.PlatformTools.logCmdErr("Error during entity creation:", error);
            process.exit(1);
        }
    }
    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------
    /**
     * Gets contents of the entity file.
     */
    static getTemplate(name) {
        return `import { Entity } from "typeorm"

@Entity()
export class ${name} {

}
`;
    }
}
exports.EntityCreateCommand = EntityCreateCommand;

//# sourceMappingURL=EntityCreateCommand.js.map
