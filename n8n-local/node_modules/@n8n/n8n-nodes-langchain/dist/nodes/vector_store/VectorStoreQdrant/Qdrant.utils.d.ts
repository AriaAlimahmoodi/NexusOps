import { QdrantClient } from '@qdrant/js-client-rest';
export type QdrantCredential = {
    qdrantUrl: string;
    apiKey: string;
};
export declare function createQdrantClient(credentials: QdrantCredential): QdrantClient;
