"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMissingSkillIds = getMissingSkillIds;
function getMissingSkillIds(skillRefs, skills) {
    const refs = skillRefs ?? [];
    const seen = new Set();
    const missing = [];
    for (const ref of refs) {
        if (seen.has(ref.id))
            continue;
        seen.add(ref.id);
        if (!skills[ref.id])
            missing.push(ref.id);
    }
    return missing;
}
//# sourceMappingURL=agent-missing-skill-ids.js.map