import { Logger } from '@n8n/backend-common';
import type { ICredentialContext } from 'n8n-workflow';
import { z } from 'zod';
import { CacheService } from '@n8n/backend-services';
import { ITokenIdentifier } from './identifier-interface';
import { OAuth2MetadataHttpClient } from './oauth2-metadata-http-client';
export declare const OAuth2UserInfoOptionsSchema: z.ZodObject<{
    metadataUri: z.ZodString;
    subjectClaim: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    expectedAudience: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    validation: z.ZodLiteral<"oauth2-userinfo">;
}, "strip", z.ZodTypeAny, {
    metadataUri: string;
    subjectClaim: string;
    expectedAudience?: string | undefined;
    validation: "oauth2-userinfo";
}, {
    metadataUri: string;
    subjectClaim?: string | undefined;
    expectedAudience?: string | undefined;
    validation: "oauth2-userinfo";
}>;
export declare const UserInfoResponseSchema: z.ZodObject<{
    sub: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    sub: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    sub: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>;
export declare class OAuth2UserInfoIdentifier implements ITokenIdentifier {
    private readonly logger;
    private readonly cache;
    private readonly http;
    private readonly jwksRefreshes;
    constructor(logger: Logger, cache: CacheService, http: OAuth2MetadataHttpClient);
    validateOptions(identifierOptions: Record<string, unknown>): Promise<void>;
    resolve(context: ICredentialContext, identifierOptions: Record<string, unknown>): Promise<string>;
    private parseOptions;
    private fetchMetadata;
    private parseUserInfoResponse;
    private resolveSubject;
    private verifyAccessToken;
    private fetchJwks;
    private refreshJwks;
    private claimAndFetchJwks;
    private queryUserInfo;
    private extractSubject;
    private cacheTtlFor;
    private resolveBasedOnUserInfo;
}
