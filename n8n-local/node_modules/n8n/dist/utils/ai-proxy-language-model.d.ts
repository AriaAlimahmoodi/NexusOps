import { type N8nProxyFeature, type ProxyContext } from '@n8n/api-types';
import type { OutboundHttp } from '@n8n/backend-network';
import type { LanguageModel } from 'ai';
import type { ProxyTokenManager } from '../services/proxy-token-manager';
export interface CreateProxyLanguageModelOptions extends ProxyContext {
    proxyBaseUrl: string;
    modelId: string;
    tokenManager: ProxyTokenManager;
    feature: N8nProxyFeature;
    n8nVersion: string;
    outboundHttp: OutboundHttp;
}
export declare function createProxyLanguageModel(options: CreateProxyLanguageModelOptions): Promise<LanguageModel>;
