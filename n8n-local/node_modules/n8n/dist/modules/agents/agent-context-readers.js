"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAgentSkill = readAgentSkill;
exports.listAgentTasks = listAgentTasks;
const n8n_workflow_1 = require("n8n-workflow");
const agent_config_hash_1 = require("./utils/agent-config-hash");
async function readAgentSkill(agentSkillsService, agentId, projectId, skillId, referencePaths = []) {
    const skill = await agentSkillsService.getSkill(agentId, projectId, skillId);
    const requestedPaths = new Set(referencePaths);
    const knownPaths = new Set(skill.references?.map((reference) => reference.path) ?? []);
    const missingPaths = [...requestedPaths].filter((path) => !knownPaths.has(path));
    if (missingPaths.length > 0) {
        throw new n8n_workflow_1.UserError(`Skill reference not found: ${missingPaths.join(', ')}`);
    }
    const { references, ...body } = skill;
    const visibleReferences = references?.map((reference) => ({
        path: reference.path,
        characterCount: reference.content.length,
        ...(requestedPaths.has(reference.path) ? { content: reference.content } : {}),
    }));
    return {
        id: skillId,
        skillHash: (0, agent_config_hash_1.getAgentSkillHash)(skill),
        skill: { ...body, ...(visibleReferences ? { references: visibleReferences } : {}) },
    };
}
async function listAgentTasks(agentTaskService, agent) {
    const enabledById = new Map((agent.schema?.tasks ?? []).map((ref) => [ref.id, ref.enabled]));
    const tasks = await agentTaskService.list(agent.id);
    return tasks.map((task) => ({ ...task, enabled: enabledById.get(task.id) ?? false }));
}
//# sourceMappingURL=agent-context-readers.js.map