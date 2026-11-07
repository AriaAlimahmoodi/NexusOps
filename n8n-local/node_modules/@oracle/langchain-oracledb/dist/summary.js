/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-explicit-any */
import oracledb from "oracledb";
/**
 * Generate a summary using models through Oracle
 * @example
 * ```typescript
 * const model = new OracleSummary(conn, params, proxy);
 * let summary = await model.getSummary(doc.pageContent);
 * ```
 */
export class OracleSummary {
    constructor(conn, pref, proxy = "") {
        Object.defineProperty(this, "conn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pref", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "proxy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.conn = conn;
        this.pref = pref;
        this.proxy = proxy;
    }
    async getSummary(text) {
        if (this.proxy) {
            await this.conn.execute("begin utl_http.set_proxy(:proxy); end;", {
                proxy: this.proxy,
            });
        }
        let summary = "";
        const result = await this.conn.execute((`select dbms_vector_chain.utl_to_summary(:content, :pref) data from dual`), {
            content: { val: text, dir: oracledb.BIND_IN, type: oracledb.CLOB },
            pref: { val: this.pref, type: oracledb.DB_TYPE_JSON },
        }, { fetchInfo: { DATA: { type: oracledb.STRING } } });
        const rows = result.rows;
        if (Symbol.iterator in Object(rows)) {
            for (const row of rows) {
                [summary] = row;
            }
        }
        return summary;
    }
}
//# sourceMappingURL=summary.js.map