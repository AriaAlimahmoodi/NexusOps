import type { ChatInstance } from '../chat-integration.service';
import type { IntegrationAction, IntegrationActionResult, IntegrationContextQuery, IntegrationToolConnectionDescriptor } from '../integration-tools';
export declare function executeLinearContextQuery(params: {
    chat: ChatInstance;
    query: IntegrationContextQuery;
    input: Record<string, unknown>;
}): Promise<unknown>;
export declare function executeLinearAction(params: {
    chat: ChatInstance;
    descriptor: IntegrationToolConnectionDescriptor;
    action: IntegrationAction;
    input: Record<string, unknown>;
}): Promise<IntegrationActionResult | undefined>;
export declare function normalizeLinearIssue(value: unknown, options?: {
    includeComments?: boolean;
    commentsLimit?: number;
}): Promise<Record<string, unknown>>;
export declare function normalizeLinearComment(value: unknown): Promise<Record<string, unknown>>;
