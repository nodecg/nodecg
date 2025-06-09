/**
 * Result object returned by UpdateQueryBuilder execution.
 */
export declare class QueryResult<T = any> {
    /**
     * Raw SQL result returned by executed query.
     */
    raw: any;
    /**
     * Rows
     */
    records: T[];
    /**
     * Number of affected rows/documents
     */
    affected?: number;
}
