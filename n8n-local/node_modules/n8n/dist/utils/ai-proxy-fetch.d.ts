import type { CustomFetch, OutboundHttp } from '@n8n/backend-network';
export declare const AI_REQUEST_TIMEOUT_MS: number;
export declare function createAiProxyFetch(outboundHttp: OutboundHttp): CustomFetch;
export declare function createAiMcpFetch(outboundHttp: OutboundHttp): CustomFetch;
export declare function createWebSearchFetch(outboundHttp: OutboundHttp): CustomFetch;
