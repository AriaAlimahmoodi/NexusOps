"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleSummary = void 0;
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-explicit-any */
const oracledb_1 = __importDefault(require("oracledb"));
/**
 * Generate a summary using models through Oracle
 * @example
 * ```typescript
 * const model = new OracleSummary(conn, params, proxy);
 * let summary = await model.getSummary(doc.pageContent);
 * ```
 */
class OracleSummary {
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
            content: { val: text, dir: oracledb_1.default.BIND_IN, type: oracledb_1.default.CLOB },
            pref: { val: this.pref, type: oracledb_1.default.DB_TYPE_JSON },
        }, { fetchInfo: { DATA: { type: oracledb_1.default.STRING } } });
        const rows = result.rows;
        if (Symbol.iterator in Object(rows)) {
            for (const row of rows) {
                [summary] = row;
            }
        }
        return summary;
    }
}
exports.OracleSummary = OracleSummary;
//# sourceMappingURL=summary.cjs.map