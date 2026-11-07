"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presentPlan = presentPlan;
exports.createAgentPlanTools = createAgentPlanTools;
const tool_1 = require("@n8n/agents/tool");
const agent_plan_work_state_1 = require("./agent-plan-work-state");
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const agent_plan_repository_1 = require("../repositories/agent-plan.repository");
const agent_plan_schema_1 = require("./agent-plan.schema");
const agent_plan_validation_1 = require("./agent-plan.validation");
const itemId = zod_1.z.union([
    zod_1.z.string().uuid().toLowerCase(),
    zod_1.z
        .string()
        .regex(/^new:[A-Za-z0-9_-]+$/, 'Use a temporary ID such as new:research for new items.'),
]);
const itemFields = { id: itemId, dependsOn: zod_1.z.array(itemId) };
const taskInput = agent_plan_schema_1.agentPlanTaskSchema
    .omit({ startedAt: true, endedAt: true })
    .extend({ ...itemFields, fallbackFor: itemId.optional() });
const groupInput = agent_plan_schema_1.agentPlanGroupSchema
    .omit({ startedAt: true, endedAt: true })
    .extend({ ...itemFields, tasks: zod_1.z.array(taskInput) });
const documentInput = agent_plan_schema_1.agentPlanDocumentSchema.extend({
    items: zod_1.z.array(zod_1.z.discriminatedUnion('kind', [taskInput, groupInput])),
});
const taskUpdate = taskInput.partial().required({ id: true }).extend({
    resultSummary: taskInput.shape.resultSummary.unwrap().nullable().optional(),
    fallbackFor: taskInput.shape.fallbackFor.unwrap().nullable().optional(),
});
const itemUpdate = taskUpdate.extend({
    kind: zod_1.z.enum(['task', 'group']).optional(),
    tasks: zod_1.z.array(taskUpdate).optional(),
});
const documentUpdate = documentInput.partial().extend({
    presentation: agent_plan_schema_1.agentPlanDocumentSchema.shape.presentation
        .unwrap()
        .partial()
        .extend({
        detail: zod_1.z.string().trim().min(1).nullable().optional(),
    })
        .nullable()
        .optional(),
    items: zod_1.z.array(itemUpdate).optional(),
});
const writeInput = zod_1.z
    .object({
    planId: zod_1.z.string().uuid().toLowerCase(),
    expectedRevision: zod_1.z.number().int().positive(),
})
    .strict();
function withoutTiming(item) {
    const { startedAt, endedAt, ...visible } = item;
    return visible;
}
function mergeDocumentUpdate(previous, update, removeItemIds) {
    const existing = new Map(previous.items
        .flatMap((item) => (item.kind === 'group' ? [item, ...item.tasks] : [item]))
        .map((item) => [item.id, item]));
    const removed = new Set(removeItemIds);
    if (removed.size !== removeItemIds.length) {
        throw new agent_plan_schema_1.AgentPlanValidationError('Removal IDs must be unique.');
    }
    for (const id of removeItemIds) {
        const item = existing.get(id);
        if (!item)
            throw new agent_plan_schema_1.AgentPlanValidationError(`Unknown removal ID: ${id}`);
        if (item.kind === 'group') {
            for (const task of item.tasks)
                removed.add(task.id);
        }
    }
    const updated = new Set();
    const mergeItems = (items, changes) => {
        const merged = new Map();
        for (const item of items) {
            if (removed.has(item.id))
                continue;
            merged.set(item.id, item.kind === 'group'
                ? { ...withoutTiming(item), tasks: mergeItems(item.tasks, []) }
                : withoutTiming(item));
        }
        for (const change of changes) {
            if (updated.has(change.id)) {
                throw new agent_plan_schema_1.AgentPlanValidationError(`Duplicate update ID: ${change.id}`);
            }
            updated.add(change.id);
            if (removed.has(change.id)) {
                throw new agent_plan_schema_1.AgentPlanValidationError(`Cannot update and remove the same item: ${change.id}`);
            }
            const current = items.find((item) => item.id === change.id);
            if (!current && !change.id.startsWith('new:')) {
                throw new agent_plan_schema_1.AgentPlanValidationError(`Unknown item ID at this level: ${change.id}`);
            }
            const { tasks, ...fields } = change;
            const item = { ...(current ? withoutTiming(current) : {}), ...fields };
            if (item.resultSummary === null)
                delete item.resultSummary;
            if (item.fallbackFor === null)
                delete item.fallbackFor;
            merged.set(change.id, tasks !== undefined || item.kind === 'group'
                ? {
                    ...item,
                    tasks: mergeItems(current?.kind === 'group' ? current.tasks : [], tasks ?? []),
                }
                : item);
        }
        return [...merged.values()];
    };
    const { items, presentation, ...fields } = update;
    const nextPresentation = presentation === null
        ? undefined
        : {
            ...previous.presentation,
            ...presentation,
        };
    if (nextPresentation?.detail === null)
        delete nextPresentation.detail;
    return documentInput.parse({
        ...previous,
        ...fields,
        presentation: presentation === undefined ? previous.presentation : nextPresentation,
        items: mergeItems(previous.items, items ?? []),
    });
}
function prepareDocument(data, previous) {
    const existing = new Map(previous?.items
        .flatMap((item) => (item.kind === 'group' ? [item, ...item.tasks] : [item]))
        .map((item) => [item.id, item]));
    const aliases = new Map();
    const items = data.items.flatMap((item) => item.kind === 'group' ? [item, ...item.tasks] : [item]);
    for (const item of items) {
        if (item.id.startsWith('new:')) {
            if (aliases.has(item.id)) {
                throw new agent_plan_schema_1.AgentPlanValidationError(`Duplicate temporary ID: ${item.id}`);
            }
            aliases.set(item.id, (0, node_crypto_1.randomUUID)());
        }
        else if (!existing.has(item.id)) {
            throw new agent_plan_schema_1.AgentPlanValidationError(`Use a new: temporary ID for the new item: ${item.id}`);
        }
    }
    const resolveId = (id) => {
        if (!id.startsWith('new:'))
            return id;
        const resolved = aliases.get(id);
        if (!resolved)
            throw new agent_plan_schema_1.AgentPlanValidationError(`Unknown temporary ID: ${id}`);
        return resolved;
    };
    const restoreItem = (item) => ({
        ...item,
        id: resolveId(item.id),
        dependsOn: item.dependsOn.map(resolveId),
        startedAt: existing.get(item.id)?.startedAt ?? null,
        endedAt: existing.get(item.id)?.endedAt ?? null,
    });
    const restoreTask = (task) => ({
        ...restoreItem(task),
        kind: task.kind,
        ...(task.fallbackFor !== undefined ? { fallbackFor: resolveId(task.fallbackFor) } : {}),
    });
    return {
        ...data,
        items: data.items.map((item) => item.kind === 'group'
            ? { ...restoreItem(item), kind: item.kind, tasks: item.tasks.map(restoreTask) }
            : restoreTask(item)),
    };
}
function presentPlan(plan) {
    if (!plan)
        return null;
    const startedAt = plan.data.items
        .flatMap((item) => (item.kind === 'group' ? [item, ...item.tasks] : [item]))
        .map((item) => item.startedAt)
        .filter((timestamp) => timestamp !== null)
        .sort()[0] ?? null;
    const leaves = (0, agent_plan_work_state_1.planLeaves)(plan.data);
    const finishedAt = leaves.length > 0 && leaves.every((item) => (0, agent_plan_validation_1.isFinal)(item.status))
        ? (leaves
            .map((item) => item.endedAt)
            .filter((timestamp) => timestamp !== null)
            .sort()
            .at(-1) ?? null)
        : null;
    return {
        planId: plan.id,
        revision: plan.revision,
        closed: plan.closedAt !== null,
        startedAt,
        finishedAt,
        closedAt: plan.closedAt?.toISOString() ?? null,
        document: {
            ...plan.data,
            items: plan.data.items.map((item) => item.kind === 'group'
                ? { ...withoutTiming(item), tasks: item.tasks.map(withoutTiming) }
                : withoutTiming(item)),
        },
        readiness: plan.readiness,
    };
}
function scopedTool(name, description, schema, handler) {
    return new tool_1.Tool(name)
        .description(description)
        .input(schema)
        .handler(async (input, context) => {
        const threadId = context.persistence?.threadId;
        if (!threadId) {
            return {
                error: 'unavailable',
                message: 'Plan tools need a persisted conversation thread.',
            };
        }
        try {
            return presentPlan(await handler(schema.parse(input), threadId, {}));
        }
        catch (error) {
            if (error instanceof agent_plan_repository_1.AgentPlanWriteConflictError) {
                return {
                    error: 'conflict',
                    message: 'The plan write conflicts with the stored state. Call read_plan before another write.',
                };
            }
            if (error instanceof agent_plan_schema_1.AgentPlanValidationError || error instanceof zod_1.z.ZodError) {
                return { error: 'invalid_plan', message: error.message };
            }
            throw error;
        }
    });
}
function createAgentPlanTools(service) {
    return [
        scopedTool('create_plan', 'Create the active plan for this conversation. Use unique new: names for new tasks and groups. ' +
            'Use these names in dependency references. Set every task and group status to "pending", including work you will start immediately. ' +
            'After creation succeeds, use update_plan with the returned permanent IDs and revision to start ready work.', zod_1.z.object({ document: documentInput }).strict(), async ({ document }, threadId, ctx) => await service.createActivePlan({
            id: (0, node_crypto_1.randomUUID)(),
            threadId,
            formatVersion: agent_plan_schema_1.AGENT_PLAN_FORMAT_VERSION,
            data: prepareDocument(document),
        }, ctx))
            .systemInstruction('Use planning for potentially long-running work, work with multiple steps, or work with complex dependencies. ' +
            'For this work, create or update the plan before research, other task tool calls, or sub-agent delegation. ' +
            'Discovery followed by a shortlist and parallel research requires a plan. A chat message describing the steps is not a plan. ' +
            'If the user asks for quick work, keep the plan compact rather than skipping it. ' +
            'Always save new tasks and groups with status "pending", in both create_plan and update_plan. ' +
            'Do not create an item as "in_progress" or "done", even when work starts immediately or already finished. ' +
            'After the write succeeds, use the returned permanent IDs and revision in a separate update_plan call to change statuses. ' +
            'Only start or complete work after its prerequisites are Done. ' +
            'If later tasks depend on research results, start with the known tasks and extend the plan after research. ' +
            'Do not invent placeholder tasks for work whose scope or targets are not yet known. ' +
            'Represent that stage as a Pending group with an empty tasks list and dependencies on the prerequisite work. ' +
            'For example, add "Research finalists" without tasks named "Finalist 1", "Finalist 2", or "Finalist 3". ' +
            'After accepting the shortlist results, add concrete tasks to that group before starting the research. ' +
            'Do not add final communication-only tasks, such as "Presented findings to user", to the plan. ' +
            'Include such a task only when it requires a sub-agent or a tool call beyond plan maintenance. ' +
            'If the current plan content and revision are not in context, call read_plan before updating the plan. ' +
            'For update_plan, send only fields that must change. Do not resend the full plan, unchanged items, or unchanged descriptions and dependencies. ' +
            'For a task status change, send document.items with only the task id, status, and any changed title or resultSummary. ' +
            'For a child task, include its group id and put the child update in tasks. Omitted fields and items stay unchanged. ' +
            'If an update is rejected, correct it and retry before reporting progress. Read the plan again if the revision changed. ' +
            'For sub-agent work on a plan task, always use delegate_subagent with mode: "background", even for short or sequential tasks. ' +
            'Do not use foreground delegation for plan work. ' +
            'This rule overrides the default foreground-delegation guidance for plan work. ' +
            'If background mode is unavailable, explain the limitation instead of delegating plan work in the foreground. ' +
            'Keep task and group statuses current. Accept results before marking work Done. ' +
            'This includes work you complete in your own reply, such as a comparison or recommendation. Mark that task Done before giving the final answer. ' +
            'Before announcing plan changes or task progress to the user, always update the plan with that information. ' +
            'Wait for the plan update to succeed before announcing the change. ' +
            'Use presentation.label for a short, factual activity label in the plan card. ' +
            'Name the current activity in a few words, such as "Checking vendor pricing", not a list of completed tasks. ' +
            'Use presentation.detail for one brief progress note, limitation, or change of approach, not a results report. ' +
            'Keep task and group titles short. Each title must explain the work without its description. ' +
            'Avoid repeated words or phrases across task and group titles at the same nesting level when clarity permits. ' +
            'Put shared context in the parent title instead of repeating it in every child title. ' +
            'Keep each title distinct and clear. Do not replace repeated words with synonyms just for variety. ' +
            'Update titles of pending or in-progress tasks to reflect the current activity. The card shows titles, not task descriptions. ' +
            'For an in-progress task, use a simple action verb with a short note in parentheses, such as "Research pricing (3 vendors)". ' +
            'When marking a task Done, use a past-tense title, such as "Researched pricing". ' +
            'Save the completed title in the same update as the Done status. Final tasks cannot change. ' +
            'Put constraints in descriptions and findings in resultSummary. ' +
            'Keep this text current through update_plan. Presentation text does not set task or group statuses. ' +
            'Before closing a plan, save a final presentation.detail summary of completed and unfinished work. ' +
            'Underlying runs do not set plan statuses.')
            .build(),
        scopedTool('read_plan', 'Read the active plan and its current revision for this conversation. Returns null if there is no active plan.', zod_1.z.object({}).strict(), async (_input, threadId, ctx) => await service.findActivePlan(threadId, ctx)).build(),
        scopedTool('update_plan', 'Update only the supplied fields at the expected revision. Omitted fields and items stay unchanged. ' +
            'Send only changed fields. Merge document.items and group tasks by id. Existing items keep their order; new items append. ' +
            'Use removeItemIds to remove items explicitly; an empty items or tasks list removes nothing. ' +
            'For new items, supply all required fields and use new: names for their IDs and references. Omit timestamps. ' +
            'Set presentation, presentation.detail, resultSummary, or fallbackFor to null to clear it. ' +
            'A supplied dependsOn list replaces the saved list. Use [] to clear it. ' +
            'Dependencies connect siblings only. Prerequisites must be done before work starts or completes. ' +
            'New tasks and groups must have status "pending". Change their statuses in a separate update after this write succeeds. ' +
            'Final items cannot change. In-progress tasks cannot change description or dependencies. Only pending items can be removed. ' +
            'fallbackFor references a failed or cancelled sibling task. Read the saved result for redirected dependencies.', writeInput.extend({
            document: documentUpdate,
            removeItemIds: zod_1.z.array(zod_1.z.string().uuid().toLowerCase()).optional(),
        }), async ({ document, removeItemIds, ...input }, threadId, ctx) => {
            const current = await service.findPlan(threadId, input.planId, ctx);
            if (!current || current.closedAt !== null || current.revision !== input.expectedRevision) {
                throw new agent_plan_repository_1.AgentPlanWriteConflictError();
            }
            return await service.replacePlan({
                ...input,
                threadId,
                formatVersion: agent_plan_schema_1.AGENT_PLAN_FORMAT_VERSION,
                data: prepareDocument(mergeDocumentUpdate(current.data, document, removeItemIds ?? []), current.data),
            }, ctx);
        }).build(),
        scopedTool('close_plan', 'Close the active plan at the expected revision. Preserve its document and release the active-plan slot. ' +
            'This does not cancel work or imply success.', writeInput, async (input, threadId, ctx) => await service.closePlan({ ...input, threadId }, ctx)).build(),
    ];
}
//# sourceMappingURL=agent-plan-tools.js.map