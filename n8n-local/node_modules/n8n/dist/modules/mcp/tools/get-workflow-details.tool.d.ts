import type { User } from '@n8n/db';
import { type INodeTypes } from 'n8n-workflow';
import z from 'zod';
import type { CredentialsService } from '../../../credentials/credentials.service';
import type { ProjectService } from '../../../services/project.service.ee';
import type { RoleService } from '@n8n/backend-services';
import type { Telemetry } from '../../../telemetry';
import type { WorkflowFinderService } from '../../../workflows/workflow-finder.service';
import type { ToolDefinition, WorkflowDetailsResult } from '../mcp.types';
import { workflowDetailsOutputSchema } from './schemas';
import { type WebhookEndpoints } from './webhook-utils';
declare const inputSchema: {
    workflowId: z.ZodString;
    detailLevel: z.ZodDefault<z.ZodEnum<["full", "execution"]>>;
};
type WorkflowDetailsLevel = z.infer<typeof inputSchema.detailLevel>;
export type WorkflowDetailsOutputSchema = typeof workflowDetailsOutputSchema;
export declare const createWorkflowDetailsTool: (user: User, baseWebhookUrl: string, workflowFinderService: WorkflowFinderService, credentialsService: CredentialsService, nodeTypes: INodeTypes, endpoints: WebhookEndpoints, telemetry: Telemetry, roleService: RoleService, projectService: ProjectService, testBaseWebhookUrl?: string) => ToolDefinition<typeof inputSchema>;
export declare function getWorkflowDetails(user: User, baseWebhookUrl: string, workflowFinderService: WorkflowFinderService, credentialsService: CredentialsService, nodeTypes: INodeTypes, endpoints: WebhookEndpoints, roleService: RoleService, projectService: ProjectService, { workflowId, detailLevel }: {
    workflowId: string;
    detailLevel?: WorkflowDetailsLevel;
}, testBaseWebhookUrl?: string): Promise<WorkflowDetailsResult>;
export {};
