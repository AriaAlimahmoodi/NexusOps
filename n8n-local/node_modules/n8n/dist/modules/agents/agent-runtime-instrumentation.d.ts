import type { FetchFn, McpToolCallSettledEvent } from '@n8n/agents';
import type { AgentJsonConfig } from '@n8n/api-types';
import type { IWorkflowExecuteAdditionalData } from 'n8n-workflow';
import type { ReferencedToolKind } from './tool-registry';
export interface AgentToolInstrumentationContext {
    toolName: string;
    toolKind: ReferencedToolKind;
}
export interface AgentMcpToolCallSettledContext extends McpToolCallSettledEvent {
    serverName: string;
}
export interface AgentRuntimeInstrumentation {
    modelFetch?: FetchFn;
    mcpFetch?: FetchFn;
    onMcpToolCallSettled?: (event: AgentMcpToolCallSettledContext) => void | Promise<void>;
    webSearch?: (args: {
        query: string;
        maxResults?: number;
        includeDomains?: string[];
        excludeDomains?: string[];
    }) => Promise<unknown>;
    configureToolAdditionalData?: (additionalData: IWorkflowExecuteAdditionalData, context: AgentToolInstrumentationContext) => void;
    transformDelegatedAgentConfig?: (config: AgentJsonConfig, context: {
        subAgentId: string;
    }) => AgentJsonConfig;
}
export type InstrumentToolAdditionalData = NonNullable<AgentRuntimeInstrumentation['configureToolAdditionalData']>;
export type PrepareWorkflowAgentForEval = (config: AgentJsonConfig, context?: {
    hasChatIntegrations?: boolean;
}) => Promise<{
    config: AgentJsonConfig;
    instrumentation: AgentRuntimeInstrumentation;
}>;
