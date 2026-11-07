import { type RuntimeSkillContent, type RuntimeSkillSource } from '@n8n/agents';
import { type PromptProfile } from '@n8n/instance-ai';
import type { InstanceAiFeatureFlags } from './instance-ai.adapter.service';
export declare const SKILLS: {
    readonly configEvals: 'config-evals';
    readonly configEvalPlaybook: 'config-eval-playbook';
    readonly instanceAwareness: 'instance-awareness';
    readonly agentBuilder: 'agent-builder';
    readonly intentRecognition: 'intent-recognition';
    readonly suggestAutomations: 'suggest-automations';
};
export type SkillId = (typeof SKILLS)[keyof typeof SKILLS];
export interface InstanceAiSkillScope {
    profile: PromptProfile;
    flags: Pick<InstanceAiFeatureFlags, 'configEvalsEnabled' | 'instanceContextEnabled'>;
    agentBuildingEnabled: boolean;
}
export interface InstanceAiRunSkills {
    source: RuntimeSkillSource;
    disabledTools: string[];
}
export declare class InstanceAiSkillsService {
    loadSkills(scope: InstanceAiSkillScope): Promise<InstanceAiRunSkills>;
    retrieveSkill(skillId: SkillId, scope: InstanceAiSkillScope): Promise<RuntimeSkillContent | null>;
    loadSkill(skillId: SkillId, scope: InstanceAiSkillScope): Promise<RuntimeSkillContent>;
}
