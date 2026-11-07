import { Logger } from '@n8n/backend-common';
import { type ICredentialContext } from 'n8n-workflow';
import { ITokenIdentifier } from './identifier-interface';
import { AuthService } from '../../../../auth/auth.service';
import { z } from 'zod/v4';
import { OAuthTokenVerifierProxy } from '@n8n/backend-services/auth';
import { TrustedSourceGate } from '@n8n/inbound-auth';
import { UserRepository } from '@n8n/db';
export declare const N8NIdentifierMetadataSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    source: z.ZodLiteral<"manual-execution">;
}, z.core.$strip>, z.ZodObject<{
    source: z.ZodEnum<{
        "chat-hub-injected": "chat-hub-injected";
        "cookie-source": "cookie-source";
    }>;
    method: z.ZodString;
    endpoint: z.ZodString;
    browserId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
    source: z.ZodLiteral<"n8n-oauth">;
    resource: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    establishedAt: z.ZodOptional<z.ZodNumber>;
    executionPath: z.ZodOptional<z.ZodArray<z.ZodString>>;
    binding: z.ZodOptional<z.ZodObject<{
        sourceId: z.ZodString;
        subject: z.ZodString;
    }, z.core.$strip>>;
    version: z.ZodLiteral<2>;
    grant: z.ZodObject<{
        audiences: z.ZodArray<z.ZodString>;
        executeAccessWorkflowId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    source: z.ZodLiteral<"n8n-oauth">;
    resource: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    establishedAt: z.ZodOptional<z.ZodNumber>;
    executionPath: z.ZodOptional<z.ZodArray<z.ZodString>>;
    binding: z.ZodOptional<z.ZodObject<{
        sourceId: z.ZodString;
        subject: z.ZodString;
    }, z.core.$strip>>;
    version: z.ZodUndefined;
    grant: z.ZodOptional<z.ZodObject<{
        audiences: z.ZodArray<z.ZodString>;
        executeAccessWorkflowId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>]>]>;
export declare const N8N_IDENTITY_SOURCES: readonly string[];
export declare function carriesN8nIdentity(context: ICredentialContext): boolean;
export declare class N8NIdentifier implements ITokenIdentifier {
    private readonly logger;
    private readonly authService;
    private readonly oauthTokenVerifierProxy;
    private readonly trustedSourceGate;
    private readonly userRepository;
    constructor(logger: Logger, authService: AuthService, oauthTokenVerifierProxy: OAuthTokenVerifierProxy, trustedSourceGate: TrustedSourceGate, userRepository: UserRepository);
    validateOptions(_: Record<string, unknown>): Promise<void>;
    resolve(context: ICredentialContext, _: Record<string, unknown>, executionId?: string): Promise<string>;
    identify(context: ICredentialContext): Promise<string | undefined>;
    private parseMetadata;
    private isSealedSubjectAuthorized;
    private isLegacySealedSubjectAuthorized;
}
