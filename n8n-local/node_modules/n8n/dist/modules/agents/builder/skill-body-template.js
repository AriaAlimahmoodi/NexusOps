"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILL_BODY_GUIDANCE = exports.SKILL_BODY_TEMPLATE = exports.SKILL_BODY_FORMAT_RULE = exports.SKILL_DESCRIPTION_RULE = void 0;
exports.SKILL_DESCRIPTION_RULE = 'The description is the routing contract — the only text the agent sees when deciding whether ' +
    'to load this skill, so it must be specific: state what the skill does AND the concrete ' +
    'situations or keywords that should trigger it (e.g. "Use when the user asks to …"), plus when ' +
    'NOT to use it where helpful. A vague description means the skill never loads.';
exports.SKILL_BODY_FORMAT_RULE = 'The body is loaded only after the skill triggers, so it must be a self-contained, actionable ' +
    'operating manual. Follow this exact Markdown structure, filling each applicable section with ' +
    'concrete, specific content — no placeholders or angle-bracket text. Do NOT put "when to use" ' +
    'triggers here; those belong in the description:';
exports.SKILL_BODY_TEMPLATE = `## Overview
<1-2 sentences: what the agent should do when this skill is loaded, and the outcome it produces.>

## Inputs
<What the agent needs before starting — required inputs, tools, credentials, or context — and how to obtain them. Write "None" if there are no prerequisites.>

## Steps
1. <First action — specific and actionable.>
2. <Next action.>

## Rules
- <A constraint or guideline the agent must always follow.>

## Example
<A concrete, representative example: the input and the expected output or result.>

## Gotchas
<Common mistakes or edge cases, and how to handle them.>`;
exports.SKILL_BODY_GUIDANCE = `${exports.SKILL_BODY_FORMAT_RULE}\n\n${exports.SKILL_BODY_TEMPLATE}`;
//# sourceMappingURL=skill-body-template.js.map