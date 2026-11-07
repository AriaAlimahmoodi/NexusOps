"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILLS_USED_PARAM_DESCRIPTION = void 0;
exports.sanitizeSkillsUsed = sanitizeSkillsUsed;
const agents_1 = require("@n8n/agents");
const MAX_SKILLS_LOGGED = 50;
const skillNameSource = agents_1.RUNTIME_SKILL_NAME_PATTERN.source.replace(/^\^|\$$/g, '');
const SKILL_ID_PATTERN = new RegExp(`^(?:${skillNameSource}:)?${skillNameSource}$`);
exports.SKILLS_USED_PARAM_DESCRIPTION = 'IDs of n8n skills used to prepare this call, e.g. "workflow-builder". An optional plugin prefix is allowed, e.g. "n8n-skills:workflow-builder". Entries are normalized server-side (trimmed, lowercased, deduped); invalid identifiers are dropped.';
function sanitizeSkillsUsed(input) {
    if (!Array.isArray(input))
        return undefined;
    const seen = new Set();
    const out = [];
    for (const raw of input) {
        if (typeof raw !== 'string')
            continue;
        const normalized = raw.trim().toLowerCase();
        if (!SKILL_ID_PATTERN.test(normalized))
            continue;
        if (seen.has(normalized))
            continue;
        seen.add(normalized);
        out.push(normalized);
        if (out.length >= MAX_SKILLS_LOGGED)
            break;
    }
    return out.length > 0 ? out : undefined;
}
//# sourceMappingURL=skills-used.js.map