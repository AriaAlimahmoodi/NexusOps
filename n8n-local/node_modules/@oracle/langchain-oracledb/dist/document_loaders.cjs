"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleDocLoader = void 0;
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-explicit-any */
const documents_1 = require("@langchain/core/documents");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const oracledb_1 = __importDefault(require("oracledb"));
const htmlparser2 = __importStar(require("htmlparser2"));
const base_1 = require("@langchain/core/document_loaders/base");
function* listDir(dir) {
    const files = node_fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory()) {
            yield* listDir(node_path_1.default.join(dir, file.name));
        }
        else {
            yield node_path_1.default.join(dir, file.name);
        }
    }
}
/**
 * Load documents from a file, a directory, or a table
 * If the document isn't a plain text file such as a PDF,
 * a plain text version will be extracted using utl_to_text
 * @example
 * ```typescript
 * const loader = new OracleDocLoader(conn, params);
 * const docs = await loader.load();
 * ```
 */
class OracleDocLoader extends base_1.BaseDocumentLoader {
    constructor(conn, pref) {
        super();
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
    /**
     * A method that loads the text file or blob and returns a promise that
     * resolves to an array of `Document` instances. It reads the text from
     * the file or blob using the `readFile` function from the
     * `node:fs/promises` module or the `text()` method of the blob. It then
     * parses the text using the `parse()` method and creates a `Document`
     * instance for each parsed page. The metadata includes the source of the
     * text (file path or blob) and, if there are multiple pages, the line
     * number of each page.
     * @returns A promise that resolves to an array of `Document` instances.
     */
    async load() {
        const docs = [];
        if ("file" in this.pref) {
            const doc = await this._loadFromFile(this.pref.file);
            if (doc != null) {
                docs.push(doc);
            }
        }
        else if ("dir" in this.pref) {
            for (const file of listDir(this.pref.dir)) {
                const doc = await this._loadFromFile(file);
                if (doc != null) {
                    docs.push(doc);
                }
            }
        }
        else if ("tablename" in this.pref) {
            if (!("owner" in this.pref) || !("colname" in this.pref)) {
                throw new Error("Invalid preferences: missing owner or colname");
            }
            docs.push(...(await this._loadFromTable(this.pref.owner, this.pref.tablename, this.pref.colname)));
        }
        else {
            throw new Error("Invalid preferences: missing file, dir, or tablename");
        }
        return docs;
    }
    // load from file
    async _loadFromFile(filename) {
        let doc = null;
        // don't specify an encoding to use binary
        const data = node_fs_1.default.readFileSync(filename);
        const result = await this.conn.execute(`select dbms_vector_chain.utl_to_text(:content, :pref) text,\
                        dbms_vector_chain.utl_to_text(:content, json('{"plaintext": "false"}')) metadata from dual`, {
            content: { val: data, dir: oracledb_1.default.BIND_IN, type: oracledb_1.default.BLOB },
            pref: { val: this.pref, type: oracledb_1.default.DB_TYPE_JSON },
        }, {
            resultSet: true,
            fetchInfo: {
                TEXT: { type: oracledb_1.default.STRING },
                METADATA: { type: oracledb_1.default.STRING },
            },
        });
        const resultSet = result.resultSet;
        try {
            if (resultSet) {
                for await (const row of resultSet) {
                    const [plain_text, metadata] = await this._extract(row);
                    doc = new documents_1.Document({
                        pageContent: plain_text,
                        metadata: metadata,
                    });
                }
            }
        }
        finally {
            if (resultSet) {
                await resultSet.close();
            }
        }
        return doc;
    }
    // load from table
    async _loadFromTable(owner, table, col) {
        const docs = [];
        // Check if names are invalid
        const qn = `${owner}.${table}`;
        try {
            const sql = `select sys.dbms_assert.simple_sql_name(:col),\
                            sys.dbms_assert.qualified_sql_name(:qn) from dual`;
            const binds = [col, qn];
            await this.conn.execute(sql, binds);
        }
        catch {
            throw new Error("Invalid owner, table, or column name");
        }
        const result = await this.conn.execute((`select dbms_vector_chain.utl_to_text(t.${this.pref.colname}, :pref) text,\
                  dbms_vector_chain.utl_to_text(t.${this.pref.colname}, json('{"plaintext": "false"}')) metadata\
                  from ${owner}.${table} t`), {
            pref: { val: this.pref, type: oracledb_1.default.DB_TYPE_JSON },
        }, {
            resultSet: true,
            fetchInfo: {
                TEXT: { type: oracledb_1.default.STRING },
                METADATA: { type: oracledb_1.default.STRING },
            },
        });
        const resultSet = result.resultSet;
        try {
            if (resultSet) {
                for await (const row of resultSet) {
                    const [plain_text, metadata] = await this._extract(row);
                    docs.push(new documents_1.Document({
                        pageContent: plain_text,
                        metadata: metadata,
                    }));
                }
            }
        }
        finally {
            if (resultSet) {
                await resultSet.close();
            }
        }
        return docs;
    }
    // extract plain text and metadata from a row
    async _extract(row) {
        const [text, htmlMetadata] = row;
        const metadata = {};
        const parser = new htmlparser2.Parser({
            onopentag(name, attrs) {
                if (name === "meta" && attrs.name) {
                    metadata[attrs.name] = attrs.content;
                }
            },
        });
        parser.write(htmlMetadata);
        parser.end();
        return [text, metadata];
    }
}
exports.OracleDocLoader = OracleDocLoader;
//# sourceMappingURL=document_loaders.cjs.map