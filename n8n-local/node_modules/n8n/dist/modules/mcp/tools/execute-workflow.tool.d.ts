import type { WorkflowsConfig } from '@n8n/config';
import type { User } from '@n8n/db';
import z from 'zod';
import type { ToolDefinition } from '../mcp.types';
import { type FoundWorkflow } from './workflow-validation.utils';
import type { McpService } from '../../../modules/mcp/mcp.service';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowRunner } from '../../../workflow-runner';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { WorkflowPublishedDataService } from '@n8n/backend-services';
export { type FoundWorkflow };
declare const inputSchema: z.ZodObject<{
    workflowId: z.ZodString;
    executionMode: z.ZodEnum<["manual", "production"]>;
    triggerNodeName: z.ZodOptional<z.ZodString>;
    inputs: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        chatInput: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        chatInput: string;
    }, {
        chatInput: string;
    }>, z.ZodObject<{
        formData: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strict", z.ZodTypeAny, {
        formData: Record<string, unknown>;
    }, {
        formData: Record<string, unknown>;
    }>, z.ZodObject<{
        webhookData: z.ZodObject<{
            method: z.ZodDefault<z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]>>>;
            query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strict", z.ZodTypeAny, {
            method: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
            query?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
            headers?: Record<string, string> | undefined;
        }, {
            method?: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | undefined;
            query?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
            headers?: Record<string, string> | undefined;
        }>;
    }, "strict", z.ZodTypeAny, {
        webhookData: {
            method: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
            query?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
            headers?: Record<string, string> | undefined;
        };
    }, {
        webhookData: {
            method?: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | undefined;
            query?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
            headers?: Record<string, string> | undefined;
        };
    }>]>>;
}, "strip", z.ZodTypeAny, {
    workflowId: string;
    executionMode: "manual" | "production";
    triggerNodeName?: string | undefined;
    inputs?: {
        chatInput: string;
    } | {
        formData: Record<string, unknown>;
    } | {
        webhookData: {
            method: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
            query?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
            headers?: Record<string, string> | undefined;
        };
    } | undefined;
}, {
    workflowId: string;
    executionMode: "manual" | "production";
    triggerNodeName?: string | undefined;
    inputs?: {
        chatInput: string;
    } | {
        formData: Record<string, unknown>;
    } | {
        webhookData: {
            method?: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | undefined;
            query?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
            headers?: Record<string, string> | undefined;
        };
    } | undefined;
}>;
type ExecuteWorkflowInput = z.infer<typeof inputSchema>;
type ExecutionMode = ExecuteWorkflowInput['executionMode'];
type ExecuteWorkflowOutput = {
    executionId: string | null;
    status: 'started' | 'error';
    error?: string;
};
export declare const createExecuteWorkflowTool: (user: User, workflowFinderService: WorkflowFinderService, workflowRunner: WorkflowRunner, telemetry: Telemetry, mcpService: McpService, workflowsConfig: WorkflowsConfig, workflowPublishedDataService: WorkflowPublishedDataService) => ToolDefinition<typeof inputSchema.shape>;
export declare const executeWorkflow: (user: User, workflowFinderService: WorkflowFinderService, workflowRunner: WorkflowRunner, mcpService: McpService, workflowsConfig: WorkflowsConfig, workflowPublishedDataService: WorkflowPublishedDataService, workflowId: string, inputs: ExecuteWorkflowInput['inputs'], executionMode: ExecutionMode, triggerNodeName?: string) => Promise<ExecuteWorkflowOutput>;
