"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExchangeRequestSchema = exports.TrustedKeyDataSchema = exports.TrustedKeySourceSchema = exports.ExternalTokenClaimsSchema = exports.JwtAlgorithmSchema = exports.TOKEN_EXCHANGE_GRANT_TYPE = void 0;
const inbound_auth_1 = require("@n8n/inbound-auth");
Object.defineProperty(exports, "JwtAlgorithmSchema", { enumerable: true, get: function () { return inbound_auth_1.JwtAlgorithmSchema; } });
const zod_1 = require("zod");
exports.TOKEN_EXCHANGE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:token-exchange';
exports.ExternalTokenClaimsSchema = zod_1.z.object({
    sub: zod_1.z.string().min(1),
    iss: zod_1.z.string().url(),
    aud: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]),
    iat: zod_1.z.number().int(),
    exp: zod_1.z.number().int(),
    jti: zod_1.z.string().min(1),
    nbf: zod_1.z.number().int().optional(),
    email: zod_1.z.string().email().optional(),
    given_name: zod_1.z.string().optional(),
    family_name: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
    email_verified: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])])
        .transform((v) => v === true || v === 'true')
        .optional(),
});
exports.TrustedKeySourceSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('static'),
        kid: zod_1.z.string().min(1),
        algorithms: zod_1.z.array(inbound_auth_1.JwtAlgorithmSchema).min(1),
        key: zod_1.z.string().min(1),
        issuer: zod_1.z.string().min(1),
        requireVerifiedEmail: zod_1.z.boolean().optional(),
        expectedAudience: zod_1.z.string().optional(),
        allowedRoles: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('jwks'),
        url: zod_1.z.string().url(),
        issuer: zod_1.z.string().min(1),
        requireVerifiedEmail: zod_1.z.boolean().optional(),
        expectedAudience: zod_1.z.string().optional(),
        allowedRoles: zod_1.z.array(zod_1.z.string()).optional(),
        cacheTtlSeconds: zod_1.z.number().int().positive().optional(),
    }),
]);
exports.TrustedKeyDataSchema = zod_1.z.object({
    algorithms: zod_1.z.array(inbound_auth_1.JwtAlgorithmSchema).min(1),
    keyMaterial: zod_1.z.string().min(1),
    issuer: zod_1.z.string().min(1),
    expectedAudience: zod_1.z.string().optional(),
    allowedRoles: zod_1.z.array(zod_1.z.string()).optional(),
    expiresAt: zod_1.z.string().optional(),
    requireVerifiedEmail: zod_1.z.boolean().optional(),
});
exports.TokenExchangeRequestSchema = zod_1.z.object({
    grant_type: zod_1.z.literal(exports.TOKEN_EXCHANGE_GRANT_TYPE),
    subject_token: zod_1.z.string().min(1),
    subject_token_type: zod_1.z.string().optional(),
    actor_token: zod_1.z.string().optional(),
    actor_token_type: zod_1.z.string().optional(),
    requested_token_type: zod_1.z.string().optional(),
    scope: zod_1.z.string().max(1024).optional(),
    audience: zod_1.z.string().max(1024).optional(),
    resource: zod_1.z.string().max(2048).optional(),
});
//# sourceMappingURL=token-exchange.schemas.js.map