import type { AgentJsonConfig } from '@n8n/api-types';
import type { WorkflowEntity } from '@n8n/db';
import type { CredentialReference, WorkflowCredentialRequirement } from './credential.types';
export declare class CredentialRequirementsExtractor {
    extractFromWorkflow(workflow: WorkflowEntity): WorkflowCredentialRequirement[];
    extractFromAgent(config: AgentJsonConfig | null): CredentialReference[];
}
