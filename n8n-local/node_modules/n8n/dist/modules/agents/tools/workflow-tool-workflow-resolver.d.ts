import type { AgentJsonConfig, AgentJsonWorkflowToolConfig } from '@n8n/api-types';
import type { WorkflowEntity, WorkflowRepository } from '@n8n/db';
export declare function findWorkflowToolWorkflows(workflowRepository: WorkflowRepository, refs: AgentJsonWorkflowToolConfig[], projectId: string): Promise<Map<string, WorkflowEntity>>;
export declare function findWorkflowToolWorkflow(workflowRepository: WorkflowRepository, ref: AgentJsonWorkflowToolConfig, projectId: string): Promise<WorkflowEntity | null>;
export declare function normalizeWorkflowToolRefs(workflowRepository: WorkflowRepository, config: AgentJsonConfig, projectId: string): Promise<void>;
