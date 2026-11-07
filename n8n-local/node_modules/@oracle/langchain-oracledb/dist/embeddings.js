/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Embeddings } from "@langchain/core/embeddings";
import oracledb from "oracledb";
/**
 * Generate embeddings using models through Oracle
 * @example
 * ```typescript
 * const embedder = new OracleEmbeddings(conn, params, proxy);
 * const embed = await embedder.embedQuery(chunk);
 * ```
 */
export class OracleEmbeddings extends Embeddings {
    constructor(conn, pref, proxy = "", fields = {}) {
        super(fields ?? {});
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
    static async loadOnnxModel(conn, dir, onnx_file, model_name) {
        await conn.execute(`begin
         dbms_data_mining.drop_model(model_name => :model, force => true);
         dbms_vector.load_onnx_model(:path, :filename, :model,
         json('{"function" : "embedding", "embeddingOutput" : "embedding" , "input": {"input": ["DATA"]}}'));
       end;`, { path: dir, filename: onnx_file, model: model_name });
    }
    async _embed(texts) {
        // replace newlines, which can negatively affect performance.
        const clean_texts = texts.map((text) => text.replace(/\n/g, " "));
        if (this.proxy) {
            await this.conn.execute("begin utl_http.set_proxy(:proxy); end;", {
                proxy: this.proxy,
            });
        }
        const embeddings = [];
        if (oracledb.thin) {
            // thin mode, can't use batching
            for (const clean_text of clean_texts) {
                const result = await this.conn.execute((`select t.column_value as data from dbms_vector_chain.utl_to_embeddings(:content, :pref) t`), {
                    content: clean_text,
                    pref: { val: this.pref, type: oracledb.DB_TYPE_JSON },
                }, { fetchInfo: { DATA: { type: oracledb.STRING } } });
                const rows = result.rows;
                if (Symbol.iterator in Object(rows)) {
                    for (const row of rows) {
                        const [chunk_str] = row;
                        const chunk = JSON.parse(chunk_str);
                        const vec = JSON.parse(chunk.embed_vector);
                        embeddings.push(vec);
                    }
                }
            }
        }
        else {
            // thick mode, can use batching
            const chunks = [];
            for (const [i, clean_text] of clean_texts.entries()) {
                const chunk = {
                    chunk_id: i,
                    chunk_data: clean_text,
                };
                chunks.push(JSON.stringify(chunk));
            }
            const VectorArrayT = await this.conn.getDbObjectClass("SYS.VECTOR_ARRAY_T");
            const inputs = new VectorArrayT(chunks);
            const result = await this.conn.execute((`select t.column_value as data from dbms_vector_chain.utl_to_embeddings(:content, :pref) t`), {
                content: inputs,
                pref: { val: this.pref, type: oracledb.DB_TYPE_JSON },
            }, { fetchInfo: { DATA: { type: oracledb.STRING } } });
            const rows = result.rows;
            if (Symbol.iterator in Object(rows)) {
                for (const row of rows) {
                    const [chunk_str] = row;
                    const chunk = JSON.parse(chunk_str);
                    const vec = JSON.parse(chunk.embed_vector);
                    embeddings.push(vec);
                }
            }
        }
        return embeddings;
    }
    /**
     * Method that takes a document as input and returns a promise that
     * resolves to an embedding for the document. It calls the _embed method
     * with the document as the input and returns the first embedding in the
     * resulting array.
     * @param document Document to generate an embedding for.
     * @returns Promise that resolves to an embedding for the document.
     */
    embedQuery(document) {
        return this._embed([document]).then((embeddings) => embeddings[0]);
    }
    /**
     * Method that takes an array of documents as input and returns a promise
     * that resolves to a 2D array of embeddings for each document. It calls
     * the _embed method with the documents as the input.
     * @param documents Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each document.
     */
    embedDocuments(documents) {
        return this._embed(documents);
    }
}
//# sourceMappingURL=embeddings.js.map