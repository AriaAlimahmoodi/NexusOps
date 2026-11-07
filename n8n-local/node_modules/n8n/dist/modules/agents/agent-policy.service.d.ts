import type { AgentJsonConfig } from '@n8n/api-types';
import type { PolicyActor } from '../../policy/policy-enforcement-backend';
import { PolicyEnforcementService } from '../../policy/policy-enforcement.service';
export type PolicedAgentContent = Pick<AgentJsonConfig, 'name' | 'tools'>;
export declare class AgentPolicyService {
    private readonly policyEnforcementService;
    constructor(policyEnforcementService: PolicyEnforcementService);
    enforceSave(projectId: string, agentId: string | null, content: PolicedAgentContent, stored: PolicedAgentContent | null, actor: PolicyActor): Promise<void>;
    enforcePublish(projectId: string, agentId: string, content: PolicedAgentContent, actor: PolicyActor): Promise<void>;
}
