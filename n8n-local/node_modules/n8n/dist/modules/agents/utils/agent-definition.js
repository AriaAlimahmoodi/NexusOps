"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentDefinitionContent = getAgentDefinitionContent;
exports.getAgentTaskBody = getAgentTaskBody;
const agent_document_1 = require("../json-config/agent-document");
function getAgentDefinitionContent(source, skillRefs, skills) {
    return {
        schema: source.schema ? (0, agent_document_1.toAgentDocument)(source.schema, skillRefs) : null,
        tools: source.tools ?? {},
        skills,
    };
}
function getAgentTaskBody(task) {
    const { name, objective, cronExpression, timezone } = task;
    return { name, objective, cronExpression, timezone: timezone ?? null };
}
//# sourceMappingURL=agent-definition.js.map