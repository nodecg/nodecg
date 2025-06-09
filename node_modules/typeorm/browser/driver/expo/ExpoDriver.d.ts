import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { ExpoConnectionOptions } from "./ExpoConnectionOptions";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { DataSource } from "../../data-source/DataSource";
export declare class ExpoDriver extends AbstractSqliteDriver {
    options: ExpoConnectionOptions;
    constructor(connection: DataSource);
    disconnect(): Promise<void>;
    createQueryRunner(): QueryRunner;
    protected createDatabaseConnection(): Promise<any>;
}
