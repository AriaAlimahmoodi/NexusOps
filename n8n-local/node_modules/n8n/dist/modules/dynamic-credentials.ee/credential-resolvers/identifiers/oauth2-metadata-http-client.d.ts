import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { IHttpRequestOptions, IN8nHttpFullResponse } from 'n8n-workflow';
import type { z } from 'zod';
import { CacheService } from '@n8n/backend-services';
interface FetchMetadataParams {
    metadataUri: string;
    cachePrefix: string;
    skipCache: boolean;
    forceRefresh?: boolean;
}
export declare class OAuth2MetadataHttpClient {
    private readonly logger;
    private readonly cache;
    private readonly http;
    constructor(logger: Logger, cache: CacheService, outboundHttp: OutboundHttp);
    requestFull(options: IHttpRequestOptions): Promise<IN8nHttpFullResponse>;
    fetchMetadata<T>(schema: z.ZodType<T>, { metadataUri, cachePrefix, skipCache, forceRefresh }: FetchMetadataParams): Promise<T>;
}
export {};
