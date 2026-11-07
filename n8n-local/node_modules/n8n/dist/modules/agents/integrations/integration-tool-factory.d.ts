import { Tool } from '@n8n/agents';
import type { AgentIntegrationConfig } from '@n8n/api-types';
import { z } from 'zod';
import type { IntegrationAction, IntegrationActionDefinition, IntegrationActionExecutor, IntegrationContextQuery, IntegrationContextQueryDefinition, IntegrationContextQueryExecutor, IntegrationMessageContextStore, IntegrationToolConnectionDescriptor, IntegrationToolConnectionSource } from './integration-tool-types';
export interface IntegrationToolCapabilities {
    contextQueries?: IntegrationContextQuery[];
    actions?: IntegrationAction[];
    contextToolDefinitions?: IntegrationContextQueryDefinition[];
    actionToolDefinitions?: IntegrationActionDefinition[];
    contextToolGuidance?: string[];
    actionToolGuidance?: string[];
}
export declare function getIntegrationToolConnectionDescriptors(integrations: AgentIntegrationConfig[], agentId?: string, capabilitiesFor?: (integration: AgentIntegrationConfig) => IntegrationToolCapabilities | undefined): IntegrationToolConnectionDescriptor[];
export declare function buildIntegrationConnectionId(integration: IntegrationToolConnectionSource): string;
export declare function createIntegrationContextTool(params: {
    descriptor: IntegrationToolConnectionDescriptor;
    queryExecutor: IntegrationContextQueryExecutor;
}): Tool<z.ZodEffects<z.ZodObject<{
    query: z.ZodOptional<z.ZodEnum<[IntegrationContextQuery, ...IntegrationContextQuery[]]>>;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    queries: z.ZodOptional<z.ZodArray<z.ZodObject<{
        query: z.ZodEnum<[IntegrationContextQuery, ...IntegrationContextQuery[]]>;
        input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strict", z.ZodTypeAny, {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }, {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    query?: IntegrationContextQuery | undefined;
    input?: Record<string, unknown> | undefined;
    queries?: {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    query?: IntegrationContextQuery | undefined;
    input?: Record<string, unknown> | undefined;
    queries?: {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}>, {
    query?: IntegrationContextQuery | undefined;
    input?: Record<string, unknown> | undefined;
    queries?: {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    query?: IntegrationContextQuery | undefined;
    input?: Record<string, unknown> | undefined;
    queries?: {
        query: IntegrationContextQuery;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}>, z.ZodTypeAny, undefined, undefined>;
export declare function createIntegrationActionTool(params: {
    descriptor: IntegrationToolConnectionDescriptor;
    messageContextStore: IntegrationMessageContextStore;
    actionExecutor: IntegrationActionExecutor;
}): Tool<z.ZodEffects<z.ZodObject<{
    action: z.ZodOptional<z.ZodEnum<[IntegrationAction, ...IntegrationAction[]]>>;
    input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        action: z.ZodEnum<[IntegrationAction, ...IntegrationAction[]]>;
        input: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strict", z.ZodTypeAny, {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }, {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    action?: IntegrationAction | undefined;
    input?: Record<string, unknown> | undefined;
    actions?: {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    action?: IntegrationAction | undefined;
    input?: Record<string, unknown> | undefined;
    actions?: {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}>, {
    action?: IntegrationAction | undefined;
    input?: Record<string, unknown> | undefined;
    actions?: {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}, {
    action?: IntegrationAction | undefined;
    input?: Record<string, unknown> | undefined;
    actions?: {
        action: IntegrationAction;
        input?: Record<string, unknown> | undefined;
    }[] | undefined;
}>, z.ZodTypeAny, z.ZodUnion<[z.ZodObject<{
    type: z.ZodLiteral<"integration_action">;
    action: z.ZodString;
    integrationConnectionId: z.ZodString;
    messageContext: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    type: "integration_action";
    action: string;
    integrationConnectionId: string;
    messageContext?: unknown;
}, {
    type: "integration_action";
    action: string;
    integrationConnectionId: string;
    messageContext?: unknown;
}>, z.ZodObject<{
    type: z.ZodLiteral<"approval">;
    toolName: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    supportsSessionApproval: z.ZodOptional<z.ZodBoolean>;
    args: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    type: "approval";
    toolName: string;
    displayName?: string | undefined;
    supportsSessionApproval?: boolean | undefined;
    args?: unknown;
}, {
    type: "approval";
    toolName: string;
    displayName?: string | undefined;
    supportsSessionApproval?: boolean | undefined;
    args?: unknown;
}>]>, z.ZodRecord<z.ZodString, z.ZodUnknown>>;
