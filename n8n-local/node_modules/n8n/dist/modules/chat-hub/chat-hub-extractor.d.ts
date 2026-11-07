import { Logger } from '@n8n/backend-common';
import { AuthenticatedRequest } from '@n8n/db';
import { ContextEstablishmentOptions, ContextEstablishmentResult, HookDescription, IContextEstablishmentHook } from '@n8n/decorators';
import { Cipher } from 'n8n-core';
import { z } from 'zod';
import { ExecutingUserIdentifierProxy } from '@n8n/backend-services';
declare const ChatHubAuthenticationMetadataSchema: z.ZodObject<{
    authToken: z.ZodString;
    browserId: z.ZodOptional<z.ZodString>;
    method: z.ZodString;
    endpoint: z.ZodString;
}, "strip", z.ZodTypeAny, {
    authToken: string;
    browserId?: string | undefined;
    method: string;
    endpoint: string;
}, {
    authToken: string;
    browserId?: string | undefined;
    method: string;
    endpoint: string;
}>;
export type ChatHubAuthenticationMetadata = z.output<typeof ChatHubAuthenticationMetadataSchema>;
export declare const CHATHUB_EXTRACTOR_NAME = "ChatHubExtractor";
export declare function extractAuthenticationMetadata(req: AuthenticatedRequest): ChatHubAuthenticationMetadata;
export declare class ChatHubExtractor implements IContextEstablishmentHook {
    private readonly logger;
    private readonly cipher;
    private readonly executingUserIdentifierProxy;
    constructor(logger: Logger, cipher: Cipher, executingUserIdentifierProxy: ExecutingUserIdentifierProxy);
    hookDescription: HookDescription;
    isApplicableToTriggerNode(_nodeType: string): boolean;
    execute(options: ContextEstablishmentOptions): Promise<ContextEstablishmentResult>;
}
export {};
