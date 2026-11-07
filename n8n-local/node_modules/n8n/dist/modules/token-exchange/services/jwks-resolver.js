"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwksResolverService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const token_exchange_schemas_1 = require("../token-exchange.schemas");
const FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_TTL_SECONDS = 3600;
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 86_400;
const supportedAlgorithmSet = new Set(token_exchange_schemas_1.JwtAlgorithmSchema.options);
const SigningJwkSchema = zod_1.z
    .object({
    kid: zod_1.z.string().min(1),
    kty: zod_1.z.enum(['RSA', 'EC']),
    alg: zod_1.z.string().optional(),
    use: zod_1.z
        .string()
        .optional()
        .refine((use) => use === undefined || use === 'sig', {
        message: 'Only signing keys (use: "sig" or absent) are accepted',
    }),
    crv: zod_1.z.string().optional(),
})
    .passthrough();
const JwkSetSchema = zod_1.z.object({
    keys: zod_1.z.array(zod_1.z.unknown()).min(1),
});
const CURVE_TO_ALGORITHM = {
    'P-256': 'ES256',
    'P-384': 'ES384',
    'P-521': 'ES512',
};
function inferAlgorithm(jwk) {
    if (jwk.alg) {
        return supportedAlgorithmSet.has(jwk.alg) ? jwk.alg : undefined;
    }
    switch (jwk.kty) {
        case 'RSA':
            return 'RS256';
        case 'EC':
            return jwk.crv ? CURVE_TO_ALGORITHM[jwk.crv] : undefined;
        default:
            return undefined;
    }
}
function parseMaxAge(cacheControl) {
    if (!cacheControl)
        return undefined;
    const match = /max-age=(\d+)/.exec(cacheControl);
    if (!match)
        return undefined;
    const value = parseInt(match[1], 10);
    return Number.isNaN(value) ? undefined : value;
}
let JwksResolverService = class JwksResolverService {
    constructor(logger, outboundHttp) {
        this.outboundHttp = outboundHttp;
        this.logger = logger.scoped('token-exchange');
    }
    async resolveKeys(source, options) {
        const fetcher = options?.fetcher ??
            this.outboundHttp
                .transport({
                useDefaultSsrfPolicy: 'unsafe',
            })
                .asCustomFetch();
        const defaultTtl = options?.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
        const { url } = source;
        this.logger.debug(`Fetching JWKS from "${url}"`);
        const { rawKeys, cacheControl } = await this.fetchJwkSet(url, fetcher);
        const ttlSeconds = this.computeTtl(cacheControl, source, defaultTtl);
        const keys = [];
        const skipped = [];
        for (const rawJwk of rawKeys) {
            const result = this.parseJwk(rawJwk, source);
            if ('resolved' in result) {
                keys.push(result.resolved);
            }
            else {
                skipped.push(result.skipped);
            }
        }
        if (keys.length === 0) {
            const reasons = skipped.map((s) => `${s.kid ?? 'unknown'}: ${s.reason}`).join('; ');
            throw new n8n_workflow_1.OperationalError(`JWKS response has no usable signing keys for "${url}" (${reasons})`);
        }
        this.logger.debug(`Resolved ${keys.length} key(s) from "${url}"`, {
            resolved: keys.length,
            skipped: skipped.length,
            ttlSeconds,
        });
        return { keys, ttlSeconds, skipped };
    }
    async fetchJwkSet(url, fetcher) {
        let response;
        try {
            response = await fetcher(url, {
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
                headers: { Accept: 'application/json' },
                redirect: 'error',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'unknown error';
            throw new n8n_workflow_1.OperationalError(`JWKS fetch failed for "${url}": ${message}`);
        }
        if (!response.ok) {
            throw new n8n_workflow_1.OperationalError(`JWKS fetch failed for "${url}": HTTP ${response.status}`);
        }
        let body;
        try {
            body = await response.json();
        }
        catch {
            throw new n8n_workflow_1.OperationalError(`JWKS response is not valid JSON for "${url}"`);
        }
        const jwkSetResult = JwkSetSchema.safeParse(body);
        if (!jwkSetResult.success) {
            throw new n8n_workflow_1.OperationalError(`JWKS response has no keys for "${url}"`);
        }
        return {
            rawKeys: jwkSetResult.data.keys,
            cacheControl: response.headers.get('cache-control'),
        };
    }
    parseJwk(rawJwk, source) {
        if (rawJwk === null || typeof rawJwk !== 'object') {
            return { skipped: { kid: undefined, reason: 'not an object' } };
        }
        const jwkResult = SigningJwkSchema.safeParse(rawJwk);
        if (!jwkResult.success) {
            const raw = rawJwk;
            return {
                skipped: {
                    kid: typeof raw.kid === 'string' ? raw.kid : undefined,
                    reason: 'failed schema validation',
                },
            };
        }
        const jwk = jwkResult.data;
        const algorithm = inferAlgorithm(jwk);
        if (!algorithm) {
            return {
                skipped: {
                    kid: jwk.kid,
                    reason: `unsupported algorithm or key type (kty=${jwk.kty}, alg=${jwk.alg ?? 'none'}, crv=${jwk.crv ?? 'none'})`,
                },
            };
        }
        let keyObject;
        try {
            keyObject = (0, node_crypto_1.createPublicKey)({ format: 'jwk', key: jwk });
        }
        catch {
            return {
                skipped: { kid: jwk.kid, reason: 'failed to create public key from JWK material' },
            };
        }
        return {
            resolved: {
                kid: jwk.kid,
                algorithms: [algorithm],
                keyMaterial: keyObject.export({ type: 'spki', format: 'pem' }),
                issuer: source.issuer,
                expectedAudience: source.expectedAudience,
                allowedRoles: source.allowedRoles,
            },
        };
    }
    computeTtl(cacheControl, source, defaultTtl) {
        const maxAge = parseMaxAge(cacheControl);
        const rawTtl = maxAge ?? source.cacheTtlSeconds ?? defaultTtl;
        return Math.max(MIN_TTL_SECONDS, Math.min(rawTtl, MAX_TTL_SECONDS));
    }
};
exports.JwksResolverService = JwksResolverService;
exports.JwksResolverService = JwksResolverService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_network_1.OutboundHttp])
], JwksResolverService);
//# sourceMappingURL=jwks-resolver.js.map