import type { RedactableExecution } from '@n8n/backend-services';
import type { IExecutionRedactionStrategy, RedactionContext } from '../execution-redaction.interfaces';
export declare class FullItemRedactionStrategy implements IExecutionRedactionStrategy {
    readonly name = "full-item-redaction";
    requiresRedaction(_execution: RedactableExecution, _context: RedactionContext): boolean;
    apply(execution: RedactableExecution, context: RedactionContext): Promise<void>;
    private redactConnections;
    private redactItem;
    private redactError;
}
