"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_OBJECTIVE_GUIDANCE = exports.TASK_OBJECTIVE_FORMAT_RULE = exports.TASK_OBJECTIVE_TEMPLATE = void 0;
exports.TASK_OBJECTIVE_TEMPLATE = `## Objective
<One sentence: the run-specific outcome to achieve and why it matters. Do not repeat the agent's overall purpose.>

## Context
<Run-specific inputs, data sources, and data lookback window, such as "items created since the previous run". Do not state when the task runs; its cadence belongs only in cronExpression.>

## Steps
1. <First task-specific action or configured skill/capability to use.>
2. <Next task-specific action. Do not copy reusable procedures from Agent Instructions or Skills.>

## Output
<The exact format of the result AND where to deliver it (e.g. "email a summary to ops@example.com", "post to Slack #alerts", "append a row to the tracking sheet"). The run is unattended, so the agent must actively deliver the result somewhere.>

## Constraints
<Task-specific scope limits, what to avoid, and what to do when there is nothing to act on, such as "if there are no new items, do nothing".>

## Success criteria
<A verifiable definition of done for a single run.>`;
exports.TASK_OBJECTIVE_FORMAT_RULE = 'The objective is the run-specific user message for each unattended run. Agent Instructions ' +
    'still apply and configured Skills remain available, so do not repeat universal rules or copy ' +
    'reusable procedures into the objective. The schedule is separate metadata in cronExpression and ' +
    'must never be repeated in the objective. It must be self-contained from the current builder ' +
    'chat and follow this exact Markdown structure, with every section filled in with concrete, ' +
    'specific content — no placeholders or angle-bracket text:';
exports.TASK_OBJECTIVE_GUIDANCE = `${exports.TASK_OBJECTIVE_FORMAT_RULE}\n\n${exports.TASK_OBJECTIVE_TEMPLATE}`;
//# sourceMappingURL=task-objective-template.js.map