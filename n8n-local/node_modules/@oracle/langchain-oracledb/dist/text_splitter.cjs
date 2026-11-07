"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleTextSplitter = void 0;
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-explicit-any */
const oracledb_1 = __importDefault(require("oracledb"));
const textsplitters_1 = require("@langchain/textsplitters");
/**
 * Split text into smaller pieces
 * @example
 * ```typescript
 * const splitter = new OracleTextSplitter(conn, params);
 * let chunks = await splitter.splitText(doc.pageContent);
 * ```
 */
class OracleTextSplitter extends textsplitters_1.TextSplitter {
    static lc_name() {
        return "OracleTextSplitter";
    }
    constructor(conn, pref, fields) {
        super(fields);
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
        this.conn = conn;
        this.pref = pref;
    }
    async splitText(text) {
        const chunks = [];
        const result = await this.conn.execute((`select t.column_value as data from dbms_vector_chain.utl_to_chunks(:content, :pref) t`), {
            content: { val: text, dir: oracledb_1.default.BIND_IN, type: oracledb_1.default.CLOB },
            pref: { val: this.pref, type: oracledb_1.default.DB_TYPE_JSON },
        }, { fetchInfo: { DATA: { type: oracledb_1.default.STRING } } });
        const rows = result.rows;
        if (Symbol.iterator in Object(rows)) {
            for (const row of rows) {
                const [chunk_str] = row;
                const chunk = JSON.parse(chunk_str);
                chunks.push(chunk.chunk_data);
            }
        }
        return chunks;
    }
}
exports.OracleTextSplitter = OracleTextSplitter;
//# sourceMappingURL=text_splitter.cjs.map