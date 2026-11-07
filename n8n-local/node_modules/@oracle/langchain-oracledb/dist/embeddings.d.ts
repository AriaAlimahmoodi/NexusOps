import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";
import oracledb from "oracledb";
/**
 * Generate embeddings using models through Oracle
 * @example
 * ```typescript
 * const embedder = new OracleEmbeddings(conn, params, proxy);
 * const embed = await embedder.embedQuery(chunk);
 * ```
 */
export declare class OracleEmbeddings extends Embeddings {
    protected conn: oracledb.Connection;
    protected pref: Record<string, unknown>;
    protected proxy: string;
    constructor(conn: oracledb.Connection, pref: Record<string, unknown>, proxy?: string, fields?: EmbeddingsParams);
    static loadOnnxModel(conn: oracledb.Connection, dir: string, onnx_file: string, model_name: string): Promise<void>;
    _embed(texts: string[]): Promise<any[]>;
    /**
     * Method that takes a document as input and returns a promise that
     * resolves to an embedding for the document. It calls the _embed method
     * with the document as the input and returns the first embedding in the
     * resulting array.
     * @param document Document to generate an embedding for.
     * @returns Promise that resolves to an embedding for the document.
     */
    embedQuery(document: string): Promise<any>;
    /**
     * Method that takes an array of documents as input and returns a promise
     * that resolves to a 2D array of embeddings for each document. It calls
     * the _embed method with the documents as the input.
     * @param documents Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each document.
     */
    embedDocuments(documents: string[]): Promise<any[]>;
}
