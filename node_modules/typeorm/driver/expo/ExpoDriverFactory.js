"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoDriverFactory = void 0;
const ExpoDriver_1 = require("./ExpoDriver");
const ExpoLegacyDriver_1 = require("./legacy/ExpoLegacyDriver");
class ExpoDriverFactory {
    constructor(connection) {
        this.connection = connection;
    }
    create() {
        if (this.isLegacyDriver) {
            return new ExpoLegacyDriver_1.ExpoLegacyDriver(this.connection);
        }
        return new ExpoDriver_1.ExpoDriver(this.connection);
    }
    get isLegacyDriver() {
        return !("openDatabaseAsync" in this.connection.options.driver);
    }
}
exports.ExpoDriverFactory = ExpoDriverFactory;

//# sourceMappingURL=ExpoDriverFactory.js.map
