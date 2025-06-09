import { ExpoDriver } from "./ExpoDriver";
import { ExpoLegacyDriver } from "./legacy/ExpoLegacyDriver";
export class ExpoDriverFactory {
    constructor(connection) {
        this.connection = connection;
    }
    create() {
        if (this.isLegacyDriver) {
            return new ExpoLegacyDriver(this.connection);
        }
        return new ExpoDriver(this.connection);
    }
    get isLegacyDriver() {
        return !("openDatabaseAsync" in this.connection.options.driver);
    }
}

//# sourceMappingURL=ExpoDriverFactory.js.map
