"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiSkillsService = exports.SKILLS = void 0;
const agents_1 = require("@n8n/agents");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const n8n_workflow_1 = require("n8n-workflow");
exports.SKILLS = {
    configEvals: 'config-evals',
    configEvalPlaybook: 'config-eval-playbook',
    instanceAwareness: 'instance-awareness',
    agentBuilder: 'agent-builder',
    intentRecognition: 'intent-recognition',
    suggestAutomations: 'suggest-automations',
};
const SKILL_GATES = [
    {
        skills: [exports.SKILLS.configEvals, exports.SKILLS.configEvalPlaybook],
        isOpen: ({ flags }) => flags.configEvalsEnabled,
    },
    {
        skills: [exports.SKILLS.instanceAwareness],
        isOpen: ({ flags }) => flags.instanceContextEnabled,
    },
    {
        skills: [exports.SKILLS.agentBuilder, exports.SKILLS.intentRecognition],
        isOpen: ({ agentBuildingEnabled }) => agentBuildingEnabled,
    },
];
let InstanceAiSkillsService = class InstanceAiSkillsService {
    async loadSkills(scope) {
        const { source, disabledTools } = await (0, instance_ai_1.loadInstanceAiPromptSkills)(scope.profile);
        const inactive = inactiveSkillIds(scope);
        return {
            source: inactive.length > 0 ? (0, agents_1.filterRuntimeSkillSource)(source, inactive) : source,
            disabledTools,
        };
    }
    async retrieveSkill(skillId, scope) {
        const { source } = await this.loadSkills(scope);
        return await source.loadSkill(skillId);
    }
    async loadSkill(skillId, scope) {
        const skill = await this.retrieveSkill(skillId, scope);
        if (!skill)
            throw new n8n_workflow_1.UnexpectedError(`Skill "${skillId}" is not active`);
        return skill;
    }
};
exports.InstanceAiSkillsService = InstanceAiSkillsService;
exports.InstanceAiSkillsService = InstanceAiSkillsService = __decorate([
    (0, di_1.Service)()
], InstanceAiSkillsService);
function inactiveSkillIds(scope) {
    return SKILL_GATES.flatMap(({ skills, isOpen }) => (isOpen(scope) ? [] : skills));
}
//# sourceMappingURL=instance-ai-skills.service.js.map