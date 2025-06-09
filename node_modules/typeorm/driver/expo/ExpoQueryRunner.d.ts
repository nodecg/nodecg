import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { ExpoDriver } from "./ExpoDriver";
export declare class ExpoQueryRunner extends AbstractSqliteQueryRunner {
    driver: ExpoDriver;
    constructor(driver: ExpoDriver);
    beforeMigration(): Promise<void>;
    afterMigration(): Promise<void>;
    query(query: string, parameters?: any[], useStructuredResult?: boolean): Promise<any>;
}
