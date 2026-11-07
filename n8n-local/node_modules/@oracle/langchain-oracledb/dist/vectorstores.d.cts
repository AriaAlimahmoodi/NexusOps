/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import oracledb from "oracledb";
import { type MaxMarginalRelevanceSearchOptions, VectorStore } from "@langchain/core/vectorstores";
import { Document, type DocumentInterface } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
export type Metadata = Record<string, unknown>;
interface AddDocumentOptions {
    ids?: string[];
    mutateOnDuplicate?: boolean;
}
export declare function generateWhereClause(dbFilter: Metadata, bindValues: unknown[]): string;
export declare const VectorType: {
    readonly DENSE: "DENSE";
    readonly SPARSE: "SPARSE";
};
export type VectorType = (typeof VectorType)[keyof typeof VectorType];
export declare const VectorElementFormat: {
    readonly INT8: "INT8";
    readonly FLOAT32: "FLOAT32";
    readonly FLOAT64: "FLOAT64";
    readonly BINARY: "BINARY";
    readonly FLEX: "*";
};
export type VectorElementFormat = (typeof VectorElementFormat)[keyof typeof VectorElementFormat];
export interface OracleDBVSArgs {
    tableName: string;
    schemaName?: string | null;
    client: oracledb.Pool | oracledb.Connection;
    query: string;
    distanceStrategy?: DistanceStrategy;
    filter?: Metadata;
    description?: string;
    annotations?: Record<string, string>;
    vectorType?: VectorType;
    format?: VectorElementFormat;
}
export declare const DistanceStrategy: {
    readonly COSINE: "COSINE";
    readonly DOT_PRODUCT: "DOT";
    readonly EUCLIDEAN: "EUCLIDEAN";
    readonly MANHATTAN: "MANHATTAN";
    readonly HAMMING: "HAMMING";
    readonly EUCLIDEAN_SQUARED: "EUCLIDEAN_SQUARED";
};
export type DistanceStrategy = (typeof DistanceStrategy)[keyof typeof DistanceStrategy];
type TableCustomization = {
    vectorType?: VectorType;
    format?: VectorElementFormat;
    description?: string;
    annotations?: Record<string, string>;
};
type ReturnedEmbedding = Float32Array | Float64Array | Int8Array | Uint8Array | number[];
interface HNSWIndexParams {
    idxName?: string;
    idxType?: string;
    neighbors?: number;
    efConstruction?: number;
    accuracy?: number;
    parallel?: number;
}
interface IVFIndexParams {
    idxName?: string;
    idxType?: string;
    neighborPart?: number;
    accuracy?: number;
    parallel?: number;
}
export declare function createTable(connection: oracledb.Connection, tableName: string, embeddingDim?: number | null, customization?: TableCustomization): Promise<void>;
export declare function createIndex(client: oracledb.Connection, vectorStore: OracleVS, params?: HNSWIndexParams | IVFIndexParams): Promise<void>;
export declare function dropTablePurge(connection: oracledb.Connection, tableName: string): Promise<void>;
export declare class OracleVS extends VectorStore {
    FilterType: Metadata;
    readonly client: oracledb.Pool | oracledb.Connection;
    embeddingDimension: number | undefined;
    readonly tableName: string;
    readonly distanceStrategy: DistanceStrategy;
    filter?: Metadata;
    readonly description?: string;
    readonly annotations?: Record<string, string>;
    readonly vectorType?: VectorType;
    readonly vectorFormat?: VectorElementFormat;
    readonly query: string;
    _vectorstoreType(): string;
    constructor(embeddings: EmbeddingsInterface, dbConfig: OracleDBVSArgs);
    private getActiveVectorType;
    private ensureEmbeddingDimension;
    private prepareVectorForStorage;
    private prepareQueryVector;
    private normalizeReturnedEmbedding;
    private coerceEmbeddingToFloat32;
    getEmbeddingDimension(query: string): Promise<number>;
    initialize(): Promise<void>;
    getConnection(): Promise<oracledb.Connection>;
    retConnection(connection: oracledb.Connection): Promise<void>;
    /**
     * Method to add vectors to the Oracle database.
     * @param vectors The vectors to add.
     * @param documents The documents associated with the vectors.
     * @param options
     * ** Add { mutateOnDuplicate?: boolean } to do upsert
     * @returns Promise that resolves when the vectors have been added.
     */
    addVectors(vectors: number[][], documents: DocumentInterface[], options?: AddDocumentOptions): Promise<string[] | undefined>;
    addDocuments(documents: DocumentInterface[], options?: AddDocumentOptions): Promise<string[] | undefined>;
    /**
     * Method to search for vectors that are similar to a given query vector.
     * @param query The query vector.
     * @param k The number of similar vectors to return.
     * @param filter Optional filter for the search results.
     * @returns Promise that resolves with an array of tuples, each containing a Document and a score.
     */
    similaritySearchByVectorReturningEmbeddings(query: number[], k?: number, filter?: this["FilterType"]): Promise<[Document, number, ReturnedEmbedding][]>;
    similaritySearchVectorWithScore(query: number[], k: number, filter?: this["FilterType"]): Promise<[DocumentInterface, number][]>;
    /**
     * Return documents selected using the maximal marginal relevance.
     * Maximal marginal relevance optimizes for similarity to the query AND diversity
     * among selected documents.
     *
     * @param {string} query - Text to look up documents similar to.
     * @param options
     * @param {number} options.k - Number of documents to return.
     * @param {number} options.fetchK - Number of documents to fetch before passing to the MMR algorithm.
     * @param {number} options.lambda - Number between 0 and 1 that determines the degree of diversity among the results,
     *                 where 0 corresponds to maximum diversity and 1 to minimum diversity.
     * @param {this["FilterType"]} options.filter - Optional filter
     * @param _callbacks
     *
     * @returns {Promise<DocumentInterface[]>} - List of documents selected by maximal marginal relevance.
     */
    maxMarginalRelevanceSearch(query: string, options: MaxMarginalRelevanceSearchOptions<this["FilterType"]>): Promise<Document[]>;
    maxMarginalRelevanceSearchByVector(embedding: number[], options: MaxMarginalRelevanceSearchOptions<this["FilterType"]>): Promise<Document[]>;
    maxMarginalRelevanceSearchWithScoreByVector(embedding: number[], options: MaxMarginalRelevanceSearchOptions<this["FilterType"]>): Promise<Array<{
        document: Document;
        score: number;
    }>>;
    delete(params: {
        ids?: Buffer[];
        deleteAll?: boolean;
    }): Promise<void>;
    static fromDocuments(documents: Document[], embeddings: EmbeddingsInterface, dbConfig: OracleDBVSArgs, options?: AddDocumentOptions): Promise<OracleVS>;
    /**
     *
     * @returns Promise that resolves when all connections
     * inside the pool are terminated.
     */
    end(): Promise<void>;
}
export {};
