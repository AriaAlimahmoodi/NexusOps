import { Logger } from '@n8n/backend-common';
import type { ICredentialContext } from 'n8n-workflow';
import { z } from 'zod';
import { ITokenIdentifier } from './identifier-interface';
import { OAuth2MetadataHttpClient } from './oauth2-metadata-http-client';
import { CacheService } from '@n8n/backend-services';
export declare const OAuth2IntrospectionOptionsSchema: z.ZodObject<{
    metadataUri: z.ZodString;
    subjectClaim: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    expectedAudience: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    validation: z.ZodLiteral<"oauth2-introspection">;
    clientId: z.ZodString;
    clientSecret: z.ZodString;
}, "strip", z.ZodTypeAny, {
    metadataUri: string;
    subjectClaim: string;
    expectedAudience?: string | undefined;
    validation: "oauth2-introspection";
    clientId: string;
    clientSecret: string;
}, {
    metadataUri: string;
    subjectClaim?: string | undefined;
    expectedAudience?: string | undefined;
    validation: "oauth2-introspection";
    clientId: string;
    clientSecret: string;
}>;
export declare const TokenIntrospectionResponseSchema: z.ZodObject<{
    active: z.ZodBoolean;
    scope: z.ZodOptional<z.ZodString>;
    client_id: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    token_type: z.ZodOptional<z.ZodString>;
    exp: z.ZodOptional<z.ZodNumber>;
    iat: z.ZodOptional<z.ZodNumber>;
    nbf: z.ZodOptional<z.ZodNumber>;
    sub: z.ZodOptional<z.ZodString>;
    aud: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    iss: z.ZodOptional<z.ZodString>;
    jti: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    active: z.ZodBoolean;
    scope: z.ZodOptional<z.ZodString>;
    client_id: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    token_type: z.ZodOptional<z.ZodString>;
    exp: z.ZodOptional<z.ZodNumber>;
    iat: z.ZodOptional<z.ZodNumber>;
    nbf: z.ZodOptional<z.ZodNumber>;
    sub: z.ZodOptional<z.ZodString>;
    aud: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    iss: z.ZodOptional<z.ZodString>;
    jti: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    active: z.ZodBoolean;
    scope: z.ZodOptional<z.ZodString>;
    client_id: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    token_type: z.ZodOptional<z.ZodString>;
    exp: z.ZodOptional<z.ZodNumber>;
    iat: z.ZodOptional<z.ZodNumber>;
    nbf: z.ZodOptional<z.ZodNumber>;
    sub: z.ZodOptional<z.ZodString>;
    aud: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    iss: z.ZodOptional<z.ZodString>;
    jti: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type TokenIntrospectionResponse = z.infer<typeof TokenIntrospectionResponseSchema>;
export declare class OAuth2TokenIntrospectionIdentifier implements ITokenIdentifier {
    private readonly logger;
    private readonly cache;
    private readonly http;
    constructor(logger: Logger, cache: CacheService, http: OAuth2MetadataHttpClient);
    validateOptions(identifierOptions: Record<string, unknown>): Promise<void>;
    resolve(context: ICredentialContext, identifierOptions: Record<string, unknown>): Promise<string>;
    private parseOptions;
    private fetchMetadata;
    private buildClientBasicRequest;
    private buildClientPostRequest;
    private parseIntrospectionResponse;
    private resolveBasedOnTokenIntrospection;
}
