"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoDriver = void 0;
const AbstractSqliteDriver_1 = require("../sqlite-abstract/AbstractSqliteDriver");
const ExpoQueryRunner_1 = require("./ExpoQueryRunner");
class ExpoDriver extends AbstractSqliteDriver_1.AbstractSqliteDriver {
    constructor(connection) {
        super(connection);
        this.sqlite = this.options.driver;
    }
    async disconnect() {
        this.queryRunner = undefined;
        await this.databaseConnection.closeAsync();
        this.databaseConnection = undefined;
    }
    createQueryRunner() {
        if (!this.queryRunner)
            this.queryRunner = new ExpoQueryRunner_1.ExpoQueryRunner(this);
        return this.queryRunner;
    }
    async createDatabaseConnection() {
        this.databaseConnection = await this.sqlite.openDatabaseAsync(this.options.database);
        await this.databaseConnection.runAsync("PRAGMA foreign_keys = ON");
        return this.databaseConnection;
    }
}
exports.ExpoDriver = ExpoDriver;

//# sourceMappingURL=ExpoDriver.js.map
