import type { CallToolResult, InputRequiredResult } from '@modelcontextprotocol/server';
import type { WorkflowPublishBlockedReason } from '@n8n/api-types';
import type { AuthenticatedRequest } from '@n8n/db';
import type { INode } from 'n8n-workflow';
import type z from 'zod';
import type { Mcpauth_type, McpCallerAuth } from '@n8n/backend-services/auth';
import type { SUPPORTED_PRODUCTION_MCP_TRIGGERS } from './mcp.constants';
import type { WorkflowDetailsOutputSchema } from './tools/get-workflow-details.tool';
export type ToolHandlerResult = CallToolResult | InputRequiredResult;
export type ToolHandler<InputArgs extends z.ZodRawShape = z.ZodRawShape, Result extends ToolHandlerResult = CallToolResult> = (args: z.objectOutputType<InputArgs, z.ZodTypeAny>, extra?: unknown) => Result | Promise<Result>;
export type ToolDefinition<InputArgs extends z.ZodRawShape = z.ZodRawShape, Result extends ToolHandlerResult = CallToolResult> = {
    name: string;
    config: {
        description?: string;
        inputSchema?: InputArgs;
        outputSchema?: z.ZodRawShape;
        annotations?: {
            title?: string;
            readOnlyHint?: boolean;
            destructiveHint?: boolean;
            idempotentHint?: boolean;
            openWorldHint?: boolean;
        };
        _meta?: Record<string, unknown>;
    };
    handler: ToolHandler<InputArgs, Result>;
};
export type RegisterToolFn = <InputArgs extends z.ZodRawShape, Result extends ToolHandlerResult = CallToolResult>(tool: ToolDefinition<InputArgs, Result>) => void;
type ResourceReadResult = {
    contents: Array<{
        uri: string;
        mimeType: string;
        text: string;
        _meta?: Record<string, unknown>;
    }>;
};
export type ResourceDefinition = {
    name: string;
    uri: string;
    config: {
        description?: string;
        mimeType?: string;
        cacheHint?: {
            ttlMs: number;
            cacheScope: 'private' | 'public';
        };
        _meta?: Record<string, unknown>;
    };
    read: () => ResourceReadResult | Promise<ResourceReadResult>;
};
export type RegisterResourceFn = (resource: ResourceDefinition) => void;
export declare const SEARCH_WORKFLOWS_SORT_BY_VALUES: readonly ['updatedAt:desc', 'updatedAt:asc', 'createdAt:desc', 'createdAt:asc', 'name:asc', 'name:desc'];
export type SearchWorkflowsSortBy = (typeof SEARCH_WORKFLOWS_SORT_BY_VALUES)[number];
export type SearchWorkflowsParams = {
    limit?: number;
    query?: string;
    projectId?: string;
    tags?: string[];
    sortBy?: SearchWorkflowsSortBy;
    folderId?: string;
    includeSubfolders?: boolean;
};
export type SearchWorkflowsItem = {
    id: string;
    name: string | null;
    description?: string | null;
    active: boolean | null;
    createdAt: string | null;
    updatedAt: string | null;
    triggerCount: number | null;
    availableInMCP: boolean;
    parentFolderId: string | null;
    tags: Array<{
        id: string;
        name: string;
    }>;
};
export type SearchWorkflowsResult = {
    data: SearchWorkflowsItem[];
    count: number;
    error?: string;
};
export type WorkflowDetailsResult = z.infer<WorkflowDetailsOutputSchema>;
export type WorkflowDetailsWorkflow = WorkflowDetailsResult['workflow'];
export type WorkflowDetailsNode = NonNullable<WorkflowDetailsWorkflow['nodes']>[number];
export type JSONRPCRequest = {
    jsonrpc?: string;
    method?: string;
    params?: {
        clientInfo?: McpClientInfo;
        _meta?: Record<string, unknown>;
        [key: string]: unknown;
    };
    id?: string | number | null;
};
export type McpClientInfo = {
    name?: string;
    version?: string;
};
export type McpAuthenticatedRequest = AuthenticatedRequest & {
    mcpCaller?: McpCallerAuth;
    mcpScopes?: string[];
};
export type McpAuthContext = {
    grantedScopes: string[] | undefined;
    caller?: McpCallerAuth;
};
export type McpAppsTelemetryVariant = 'env_override' | 'variant' | 'control' | 'unassigned';
export type UserConnectedToMCPEventPayload = {
    user_id?: string;
    client_name?: string;
    client_version?: string;
    protocol_version?: string;
    auth_type?: Mcpauth_type;
    mcp_connection_status: 'success' | 'error';
    http_status?: number;
    mcp_apps_enabled?: boolean;
    mcp_apps_variant?: McpAppsTelemetryVariant;
    error?: string;
};
export type ExecuteWorkflowsInputMeta = {
    type?: 'webhook' | 'chat' | 'form';
    parameter_count?: number;
    triggerNodeName?: string;
};
export type WorkflowNotFoundReason = 'workflow_does_not_exist' | 'no_permission' | 'workflow_archived' | 'not_available_in_mcp' | 'workflow_not_active' | 'unsupported_trigger' | 'execution_not_found' | 'invalid_pin_data' | 'invalid_inputs';
export type UserCalledMCPToolEventPayload = {
    user_id?: string;
    tool_name: string;
    parameters?: Record<string, unknown>;
    results?: {
        success: boolean;
        data?: unknown;
        error?: string | Record<string, unknown>;
        error_reason?: WorkflowNotFoundReason | WorkflowPublishBlockedReason;
    };
};
export type N8nConnectCoverage = {
    credentialTypes: string[];
    nodes: string[];
};
export type MCPTriggersMap = {
    [K in keyof typeof SUPPORTED_PRODUCTION_MCP_TRIGGERS]: INode[];
};
export {};
