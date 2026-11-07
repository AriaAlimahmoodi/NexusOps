import type { AgentJsonConfig, AgentJsonWorkflowToolConfig } from '@n8n/api-types';
export declare function extractAgentWorkflowRefs(config: Pick<AgentJsonConfig, 'tools'> | null | undefined): AgentJsonWorkflowToolConfig[];
