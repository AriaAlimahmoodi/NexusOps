import { type AgentSkillAvailability, type AgentSkill, type AgentSkillMutationResponse, type SkillCreateMethod } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { TransactionRunner } from '@n8n/db';
import { type AgentMutationTelemetryContext } from './agent-modification-telemetry.service';
import { AgentSaveCompletionService } from './agent-save-completion.service';
import { AgentSkillRefsService } from './agent-skill-refs.service';
import { AgentRepository } from './repositories/agent.repository';
import { SkillService } from './skills/skill.service';
import { SkillsTelemetry } from './skills/skills-telemetry';
import { type SkillInstructionEdit } from './utils/skill-instruction-edits';
export declare class AgentSkillsService {
    private readonly logger;
    private readonly agentRepository;
    private readonly saveCompletion;
    private readonly agentSkillRefs;
    private readonly skillService;
    private readonly transactionRunner;
    private readonly skillsTelemetry;
    constructor(logger: Logger, agentRepository: AgentRepository, saveCompletion: AgentSaveCompletionService, agentSkillRefs: AgentSkillRefsService, skillService: SkillService, transactionRunner: TransactionRunner, skillsTelemetry: SkillsTelemetry);
    listSkills(agentId: string, projectId: string): Promise<Record<string, AgentSkill>>;
    getSkill(agentId: string, projectId: string, skillId: string): Promise<AgentSkill>;
    createAndAttachSkills(agentId: string, projectId: string, skills: AgentSkill[], context: AgentMutationTelemetryContext): Promise<{
        skills: AgentSkillMutationResponse[];
        configHash: string | null;
    }>;
    createAndAttachSkill(agentId: string, projectId: string, skill: AgentSkill, context: AgentMutationTelemetryContext, availableTo?: AgentSkillAvailability, method?: SkillCreateMethod): Promise<AgentSkillMutationResponse>;
    private createSkillsBatch;
    updateSkill(agentId: string, projectId: string, skillId: string, updates: Partial<AgentSkill>, context: AgentMutationTelemetryContext, baseSkillHash?: string, instructionEdits?: SkillInstructionEdit[], availableTo?: AgentSkillAvailability): Promise<AgentSkillMutationResponse>;
    deleteSkill(agentId: string, projectId: string, skillId: string, context: AgentMutationTelemetryContext): Promise<void>;
    private availabilityChange;
    private updateLegacySkill;
    private validateSkill;
    private assertCanCreateSkills;
    private assertNoNameClashes;
}
