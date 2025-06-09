import { DataSource } from "../../data-source";
import { ExpoDriver } from "./ExpoDriver";
import { ExpoLegacyDriver } from "./legacy/ExpoLegacyDriver";
export declare class ExpoDriverFactory {
    connection: DataSource;
    constructor(connection: DataSource);
    create(): ExpoDriver | ExpoLegacyDriver;
    private get isLegacyDriver();
}
