import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { ExpoQueryRunner } from "./ExpoQueryRunner";
export class ExpoDriver extends AbstractSqliteDriver {
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
            this.queryRunner = new ExpoQueryRunner(this);
        return this.queryRunner;
    }
    async createDatabaseConnection() {
        this.databaseConnection = await this.sqlite.openDatabaseAsync(this.options.database);
        await this.databaseConnection.runAsync("PRAGMA foreign_keys = ON");
        return this.databaseConnection;
    }
}

//# sourceMappingURL=ExpoDriver.js.map
