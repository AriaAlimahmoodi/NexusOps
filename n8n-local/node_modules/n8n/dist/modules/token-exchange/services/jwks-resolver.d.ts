import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { JwksKeySource } from '../token-exchange.schemas';
export interface SkippedKey {
    kid?: string;
    reason: string;
}
export interface JwksResolvedKey {
    kid: string;
    algorithms: string[];
    keyMaterial: string;
    issuer: string;
    expectedAudience?: string;
    allowedRoles?: string[];
}
export interface JwksResolverResult {
    keys: JwksResolvedKey[];
    ttlSeconds: number;
    skipped: SkippedKey[];
}
export declare class JwksResolverService {
    private readonly outboundHttp;
    private readonly logger;
    constructor(logger: Logger, outboundHttp: OutboundHttp);
    resolveKeys(source: JwksKeySource, options?: {
        fetcher?: typeof fetch;
        defaultTtlSeconds?: number;
    }): Promise<JwksResolverResult>;
    private fetchJwkSet;
    private parseJwk;
    private computeTtl;
}
