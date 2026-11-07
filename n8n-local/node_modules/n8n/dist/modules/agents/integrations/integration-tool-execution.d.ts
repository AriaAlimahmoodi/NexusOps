import { type InterruptibleToolContext, type ToolContext } from '@n8n/agents';
import { z } from 'zod';
import type { IntegrationActionExecutor, IntegrationMessageContext, IntegrationMessageContextStore, IntegrationContextQueryExecutor, IntegrationToolConnectionDescriptor } from './integration-tool-types';
import type { RawActionToolOperation, RawContextToolOperation } from './integration-tool-schema';
export declare const INTEGRATION_ACTION_RESUME_SCHEMA: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export declare function isSilentActionOutput(output: unknown): boolean;
export declare function integrationActionApprovalKey(connectionId: string, action: string): string;
export declare function executeContextToolOperation(params: {
    operation: RawContextToolOperation;
    descriptor: IntegrationToolConnectionDescriptor;
    queryExecutor: IntegrationContextQueryExecutor;
    persistence: ToolContext['persistence'];
}): Promise<unknown>;
export declare function executeActionToolBatch(params: {
    operations: RawActionToolOperation[];
    descriptor: IntegrationToolConnectionDescriptor;
    messageContextStore: IntegrationMessageContextStore;
    actionExecutor: IntegrationActionExecutor;
    ctx: ToolContext;
}): Promise<unknown>;
export declare function executeActionToolOperation(params: {
    operation: RawActionToolOperation;
    descriptor: IntegrationToolConnectionDescriptor;
    messageContextStore: IntegrationMessageContextStore;
    actionExecutor: IntegrationActionExecutor;
    ctx: ToolContext;
    interruptCtx?: InterruptibleToolContext;
    currentMessageContext?: IntegrationMessageContext;
    allowSuspend: boolean;
    approvedAction?: string;
}): Promise<unknown>;
