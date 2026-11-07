import type { Secret } from 'jsonwebtoken';
import { JwtAlgorithmSchema, type JwtAlgorithm } from '@n8n/inbound-auth';
import { z } from 'zod';
export declare const TOKEN_EXCHANGE_GRANT_TYPE: 'urn:ietf:params:oauth:grant-type:token-exchange';
export { JwtAlgorithmSchema, type JwtAlgorithm };
export declare const ExternalTokenClaimsSchema: z.ZodObject<{
    sub: z.ZodString;
    iss: z.ZodString;
    aud: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    iat: z.ZodNumber;
    exp: z.ZodNumber;
    jti: z.ZodString;
    nbf: z.ZodOptional<z.ZodNumber>;
    email: z.ZodOptional<z.ZodString>;
    given_name: z.ZodOptional<z.ZodString>;
    family_name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    email_verified: z.ZodOptional<z.ZodEffects<z.ZodUnion<[z.ZodBoolean, z.ZodEnum<["true", "false"]>]>, boolean, "false" | "true" | boolean>>;
}, "strip", z.ZodTypeAny, {
    sub: string;
    iss: string;
    aud: string | string[];
    iat: number;
    exp: number;
    jti: string;
    nbf?: number | undefined;
    email?: string | undefined;
    given_name?: string | undefined;
    family_name?: string | undefined;
    role?: string | undefined;
    email_verified?: boolean | undefined;
}, {
    sub: string;
    iss: string;
    aud: string | string[];
    iat: number;
    exp: number;
    jti: string;
    nbf?: number | undefined;
    email?: string | undefined;
    given_name?: string | undefined;
    family_name?: string | undefined;
    role?: string | undefined;
    email_verified?: "false" | "true" | boolean | undefined;
}>;
export type ExternalTokenClaims = z.infer<typeof ExternalTokenClaimsSchema>;
export declare const TrustedKeySourceSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"static">;
    kid: z.ZodString;
    algorithms: z.ZodArray<z.ZodEnum<["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256", "PS384", "PS512"]>, "many">;
    key: z.ZodString;
    issuer: z.ZodString;
    requireVerifiedEmail: z.ZodOptional<z.ZodBoolean>;
    expectedAudience: z.ZodOptional<z.ZodString>;
    allowedRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "static";
    kid: string;
    algorithms: ("ES256" | "ES384" | "ES512" | "PS256" | "PS384" | "PS512" | "RS256" | "RS384" | "RS512")[];
    key: string;
    issuer: string;
    requireVerifiedEmail?: boolean | undefined;
    expectedAudience?: string | undefined;
    allowedRoles?: string[] | undefined;
}, {
    type: "static";
    kid: string;
    algorithms: ("ES256" | "ES384" | "ES512" | "PS256" | "PS384" | "PS512" | "RS256" | "RS384" | "RS512")[];
    key: string;
    issuer: string;
    requireVerifiedEmail?: boolean | undefined;
    expectedAudience?: string | undefined;
    allowedRoles?: string[] | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"jwks">;
    url: z.ZodString;
    issuer: z.ZodString;
    requireVerifiedEmail: z.ZodOptional<z.ZodBoolean>;
    expectedAudience: z.ZodOptional<z.ZodString>;
    allowedRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    cacheTtlSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "jwks";
    url: string;
    issuer: string;
    requireVerifiedEmail?: boolean | undefined;
    expectedAudience?: string | undefined;
    allowedRoles?: string[] | undefined;
    cacheTtlSeconds?: number | undefined;
}, {
    type: "jwks";
    url: string;
    issuer: string;
    requireVerifiedEmail?: boolean | undefined;
    expectedAudience?: string | undefined;
    allowedRoles?: string[] | undefined;
    cacheTtlSeconds?: number | undefined;
}>]>;
export type TrustedKeySource = z.infer<typeof TrustedKeySourceSchema>;
export type StaticKeySource = Extract<TrustedKeySource, {
    type: 'static';
}>;
export type JwksKeySource = Extract<TrustedKeySource, {
    type: 'jwks';
}>;
export type TrustedKeySourceType = 'static' | 'jwks';
export type TrustedKeySourceStatus = 'pending' | 'healthy' | 'error';
export declare const TrustedKeyDataSchema: z.ZodObject<{
    algorithms: z.ZodArray<z.ZodEnum<["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256", "PS384", "PS512"]>, "many">;
    keyMaterial: z.ZodString;
    issuer: z.ZodString;
    expectedAudience: z.ZodOptional<z.ZodString>;
    allowedRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    expiresAt: z.ZodOptional<z.ZodString>;
    requireVerifiedEmail: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    algorithms: ("ES256" | "ES384" | "ES512" | "PS256" | "PS384" | "PS512" | "RS256" | "RS384" | "RS512")[];
    keyMaterial: string;
    issuer: string;
    expectedAudience?: string | undefined;
    allowedRoles?: string[] | undefined;
    expiresAt?: string | undefined;
    requireVerifiedEmail?: boolean | undefined;
}, {
    algorithms: ("ES256" | "ES384" | "ES512" | "PS256" | "PS384" | "PS512" | "RS256" | "RS384" | "RS512")[];
    keyMaterial: string;
    issuer: string;
    expectedAudience?: string | undefined;
    allowedRoles?: string[] | undefined;
    expiresAt?: string | undefined;
    requireVerifiedEmail?: boolean | undefined;
}>;
export type TrustedKeyData = z.infer<typeof TrustedKeyDataSchema>;
export type ResolvedSourceKeys = {
    keys: Array<{
        kid: string;
        data: TrustedKeyData;
    }>;
    cacheTtlSeconds?: number;
};
export interface ResolvedTrustedKey {
    kid: string;
    algorithms: JwtAlgorithm[];
    key: Secret;
    issuer: string;
    expectedAudience?: string;
    allowedRoles?: string[];
    requireVerifiedEmail: boolean;
}
export declare const TokenExchangeRequestSchema: z.ZodObject<{
    grant_type: z.ZodLiteral<"urn:ietf:params:oauth:grant-type:token-exchange">;
    subject_token: z.ZodString;
    subject_token_type: z.ZodOptional<z.ZodString>;
    actor_token: z.ZodOptional<z.ZodString>;
    actor_token_type: z.ZodOptional<z.ZodString>;
    requested_token_type: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
    audience: z.ZodOptional<z.ZodString>;
    resource: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange";
    subject_token: string;
    subject_token_type?: string | undefined;
    actor_token?: string | undefined;
    actor_token_type?: string | undefined;
    requested_token_type?: string | undefined;
    scope?: string | undefined;
    audience?: string | undefined;
    resource?: string | undefined;
}, {
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange";
    subject_token: string;
    subject_token_type?: string | undefined;
    actor_token?: string | undefined;
    actor_token_type?: string | undefined;
    requested_token_type?: string | undefined;
    scope?: string | undefined;
    audience?: string | undefined;
    resource?: string | undefined;
}>;
export type TokenExchangeRequest = z.infer<typeof TokenExchangeRequestSchema>;
