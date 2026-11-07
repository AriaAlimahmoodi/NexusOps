import { SSETransport } from './SSETransport';
import { StreamableHttpTransport } from './StreamableHttpTransport';
import type { CompressionResponse } from './Transport';
export interface StreamableHttpOptions {
    sessionIdGenerator?: () => string;
    onsessioninitialized?: (sessionId: string) => Promise<void>;
}
export declare class TransportFactory {
    createSSE(postUrl: string, response: CompressionResponse): SSETransport;
    createStreamableHttp(options: StreamableHttpOptions, response: CompressionResponse): StreamableHttpTransport;
    recreateStreamableHttp(sessionId: string, response: CompressionResponse): StreamableHttpTransport;
}
