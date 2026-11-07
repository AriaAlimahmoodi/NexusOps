import type { User } from '@n8n/db';
import type { RedactableExecution } from '@n8n/backend-services';
export interface RedactionContext {
    readonly user: User;
    readonly redactExecutionData: boolean | undefined;
    readonly userCanReveal: boolean;
    readonly enforceDynCredRedaction: boolean;
    readonly enforceCredentialUsabilityRedaction: boolean;
    readonly inaccessibleCredentialIds: readonly string[];
    readonly redactedBySubWorkflow: boolean;
    readonly memo: Map<string, unknown>;
}
export interface IExecutionRedactionStrategy {
    readonly name: string;
    apply(execution: RedactableExecution, context: RedactionContext): Promise<void>;
    requiresRedaction(execution: RedactableExecution, context: RedactionContext): boolean;
}
