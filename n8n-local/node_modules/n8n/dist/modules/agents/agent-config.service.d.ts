import type { AgentConfigMutationResponse, AgentJsonConfig } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { TransactionRunner, type User } from '@n8n/db';
import { type AgentActor } from './agent-modification-telemetry.service';
import { AgentConfigPreparationService } from './agent-config-preparation.service';
import { AgentPolicyService } from './agent-policy.service';
import { AgentSaveCompletionService } from './agent-save-completion.service';
import { AgentSetupCompletionService } from './agent-setup-completion.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import { AgentTaskRepository } from './repositories/agent-task.repository';
import { AgentRepository } from './repositories/agent.repository';
interface AgentConfigUpdateOptions {
    baseConfigHash: string | null;
    clearOmittedOptionalFields?: boolean;
    modifiedBy: AgentActor;
    pushRef?: string;
}
export declare class AgentConfigService {
    private readonly logger;
    private readonly agentRepository;
    private readonly agentTaskRepository;
    private readonly configPreparation;
    private readonly setupCompletionService;
    private readonly transactionRunner;
    private readonly saveCompletion;
    private readonly agentPolicyService;
    private readonly agentSkillRefs;
    constructor(logger: Logger, agentRepository: AgentRepository, agentTaskRepository: AgentTaskRepository, configPreparation: AgentConfigPreparationService, setupCompletionService: AgentSetupCompletionService, transactionRunner: TransactionRunner, saveCompletion: AgentSaveCompletionService, agentPolicyService: AgentPolicyService, agentSkillRefs: AgentSkillRefsService);
    getConfig(agentId: string, projectId: string): Promise<AgentJsonConfig>;
    validateConfig(raw: unknown): Promise<{
        valid: true;
        config: AgentJsonConfig;
    } | {
        valid: false;
        error: string;
    }>;
    updateConfig(agentId: string, projectId: string, config: unknown, user: User, options: AgentConfigUpdateOptions): Promise<AgentConfigMutationResponse>;
    private finishConfigUpdate;
    private removeUnreferencedTasks;
    private saveConfig;
    private removeUnreferencedResources;
    private removeUnreferencedCustomTools;
    private buildConfigReplacement;
    private mergeConfigSchema;
    private reconcileConfigReferences;
    private reconcileSubAgentReferences;
    private validateSubAgentRefs;
}
export {};
