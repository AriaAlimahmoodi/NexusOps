import { Logger } from '@n8n/backend-common';
import type { ICredentialContext } from 'n8n-workflow';
import { z } from 'zod';
import { type ITokenIdentifier } from './identifier-interface';
export declare const SlackSignatureOptionsSchema: z.ZodObject<{
    signingSecret: z.ZodString;
    subjectClaim: z.ZodDefault<z.ZodEnum<["user_id", "team_user"]>>;
}, "strip", z.ZodTypeAny, {
    signingSecret: string;
    subjectClaim: "team_user" | "user_id";
}, {
    signingSecret: string;
    subjectClaim?: "team_user" | "user_id" | undefined;
}>;
export declare class SlackSignatureIdentifier implements ITokenIdentifier {
    private readonly logger;
    constructor(logger: Logger);
    validateOptions(identifierOptions: Record<string, unknown>): Promise<void>;
    resolve(context: ICredentialContext, identifierOptions: Record<string, unknown>): Promise<string>;
    resolveKey(context: ICredentialContext, identifierOptions: Record<string, unknown>): string;
    private deriveKey;
    private parseOptions;
    private verifySlackSignature;
    private extractSlackIdentity;
    private extractFlatFieldBody;
    private extractInteractivePayloadBody;
    private extractEventPayloadBody;
}
