import type { HttpTransport } from '@n8n/backend-network';
import type { FetchedPage } from '@n8n/instance-ai';
export interface FetchAndExtractOptions {
    maxContentLength?: number;
    maxResponseBytes?: number;
    timeoutMs?: number;
    abortSignal?: AbortSignal;
    transport: HttpTransport;
}
export declare function fetchAndExtract(url: string, options: FetchAndExtractOptions): Promise<FetchedPage>;
