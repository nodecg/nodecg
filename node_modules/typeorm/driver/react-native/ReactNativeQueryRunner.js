"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNativeQueryRunner = void 0;
const QueryFailedError_1 = require("../../error/QueryFailedError");
const QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
const QueryResult_1 = require("../../query-runner/QueryResult");
const Broadcaster_1 = require("../../subscriber/Broadcaster");
const BroadcasterResult_1 = require("../../subscriber/BroadcasterResult");
const AbstractSqliteQueryRunner_1 = require("../sqlite-abstract/AbstractSqliteQueryRunner");
/**
 * Runs queries on a single sqlite database connection.
 */
class ReactNativeQueryRunner extends AbstractSqliteQueryRunner_1.AbstractSqliteQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster_1.Broadcaster(this);
    }
    /**
     * Called before migrations are run.
     */
    async beforeMigration() {
        await this.query(`PRAGMA foreign_keys = OFF`);
    }
    /**
     * Called after migrations are run.
     */
    async afterMigration() {
        await this.query(`PRAGMA foreign_keys = ON`);
    }
    /**
     * Executes a given SQL query.
     */
    async query(query, parameters, useStructuredResult = false) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        const databaseConnection = await this.connect();
        this.driver.connection.logger.logQuery(query, parameters, this);
        await this.broadcaster.broadcast("BeforeQuery", query, parameters);
        const broadcasterResult = new BroadcasterResult_1.BroadcasterResult();
        const queryStartTime = Date.now();
        return new Promise(async (ok, fail) => {
            try {
                databaseConnection.executeSql(query, parameters, async (raw) => {
                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime;
                    const queryEndTime = Date.now();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    this.broadcaster.broadcastAfterQueryEvent(broadcasterResult, query, parameters, true, queryExecutionTime, raw, undefined);
                    if (maxQueryExecutionTime &&
                        queryExecutionTime > maxQueryExecutionTime)
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                    if (broadcasterResult.promises.length > 0)
                        await Promise.all(broadcasterResult.promises);
                    const result = new QueryResult_1.QueryResult();
                    if (raw?.hasOwnProperty("rowsAffected")) {
                        result.affected = raw.rowsAffected;
                    }
                    if (raw?.hasOwnProperty("rows")) {
                        const records = [];
                        for (let i = 0; i < raw.rows.length; i++) {
                            records.push(raw.rows.item(i));
                        }
                        result.raw = records;
                        result.records = records;
                    }
                    // return id of inserted row, if query was insert statement.
                    if (query.substr(0, 11) === "INSERT INTO") {
                        result.raw = raw.insertId;
                    }
                    if (useStructuredResult) {
                        ok(result);
                    }
                    else {
                        ok(result.raw);
                    }
                }, async (err) => {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    this.broadcaster.broadcastAfterQueryEvent(broadcasterResult, query, parameters, false, undefined, undefined, err);
                    fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
                });
            }
            catch (err) {
                fail(err);
            }
            finally {
                await broadcasterResult.wait();
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    parametrize(objectLiteral, startIndex = 0) {
        return Object.keys(objectLiteral).map((key, index) => `"${key}"` + "=?");
    }
}
exports.ReactNativeQueryRunner = ReactNativeQueryRunner;

//# sourceMappingURL=ReactNativeQueryRunner.js.map
