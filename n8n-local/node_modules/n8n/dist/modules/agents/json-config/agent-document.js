"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAgentDocument = toAgentDocument;
exports.fromAgentDocument = fromAgentDocument;
exports.withoutLegacySkillRefs = withoutLegacySkillRefs;
function toAgentDocument(config, refs) {
    const { skills: _storedSkills, ...rest } = config;
    return refs === undefined ? rest : { ...rest, skills: refs };
}
function fromAgentDocument(document) {
    const { skills, ...config } = document;
    return { config, skillRefs: skills };
}
function withoutLegacySkillRefs(config) {
    const { skills: _legacy, ...rest } = config;
    return rest;
}
//# sourceMappingURL=agent-document.js.map