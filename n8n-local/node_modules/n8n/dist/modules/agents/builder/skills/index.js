"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuilderRuntimeSkills = getBuilderRuntimeSkills;
const config_skill_1 = require("./config.skill");
const custom_tools_skill_1 = require("./custom-tools.skill");
const external_services_skill_1 = require("./external-services.skill");
const memory_skill_1 = require("./memory.skill");
const node_tools_skill_1 = require("./node-tools.skill");
const resource_locators_skill_1 = require("./resource-locators.skill");
const sub_agents_skill_1 = require("./sub-agents.skill");
const target_skills_skill_1 = require("./target-skills.skill");
const target_tasks_skill_1 = require("./target-tasks.skill");
const AGENT_BUILDER_SKILL_ID = 'agent-builder';
function asAgentBuilderReference(skill) {
    return {
        ...skill,
        parents: [AGENT_BUILDER_SKILL_ID],
        reference: { owner: AGENT_BUILDER_SKILL_ID, path: `references/${skill.id}.md` },
    };
}
function getBuilderRuntimeSkills() {
    return [
        (0, config_skill_1.configSkill)(),
        (0, custom_tools_skill_1.customToolsSkill)(),
        (0, external_services_skill_1.externalServicesSkill)(),
        (0, memory_skill_1.memorySkill)(),
        (0, node_tools_skill_1.nodeToolsSkill)(),
        (0, resource_locators_skill_1.resourceLocatorsSkill)(),
        (0, sub_agents_skill_1.subAgentsSkill)(),
        (0, target_skills_skill_1.targetSkillsSkill)(),
        (0, target_tasks_skill_1.targetTasksSkill)(),
    ].map(asAgentBuilderReference);
}
//# sourceMappingURL=index.js.map