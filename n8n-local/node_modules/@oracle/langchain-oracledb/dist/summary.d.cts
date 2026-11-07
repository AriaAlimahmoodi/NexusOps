import oracledb from "oracledb";
/**
 * Generate a summary using models through Oracle
 * @example
 * ```typescript
 * const model = new OracleSummary(conn, params, proxy);
 * let summary = await model.getSummary(doc.pageContent);
 * ```
 */
export declare class OracleSummary {
    protected conn: oracledb.Connection;
    protected pref: Record<string, unknown>;
    protected proxy: string;
    constructor(conn: oracledb.Connection, pref: Record<string, unknown>, proxy?: string);
    getSummary(text: string): Promise<string>;
}
