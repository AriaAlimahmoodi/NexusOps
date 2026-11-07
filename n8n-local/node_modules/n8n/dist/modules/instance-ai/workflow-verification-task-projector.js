"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowVerificationTaskProjector = void 0;
const instance_ai_1 = require("@n8n/instance-ai");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const workflow_verification_obligation_service_1 = require("./workflow-verification-obligation-service");
const BUILD_DESCRIPTION = 'Build workflow';
const VERIFY_DESCRIPTION = 'Verify workflow';
const DETAIL = {
    building: 'Building workflow',
    waitingForBuild: 'Waiting for build',
    buildIncomplete: 'Build did not complete',
    verificationPending: 'Verification pending',
    verifying: 'Verifying workflow',
    needsSetup: 'Needs setup',
    couldNotVerify: 'Could not verify automatically',
    verificationOptional: 'Verification optional - one-off run',
    noWorkflow: 'No workflow to verify',
    submitted: 'Submitted',
    blocked: 'Blocked',
    cancelled: 'Cancelled',
};
function verifyRowId(buildTaskId) {
    return `${buildTaskId}:verify`;
}
function formatVerifiedDetail(evidence) {
    if (!evidence?.attempted || !evidence.success)
        return 'Verified';
    const parts = [
        evidence.executionId ? `execution ${evidence.executionId}` : '',
        typeof evidence.evidence?.producedOutputRows === 'number'
            ? `${evidence.evidence.producedOutputRows} output rows`
            : '',
    ].filter((part) => part.length > 0);
    return parts.length > 0 ? `Verified - ${parts.join(', ')}` : 'Verified';
}
function obligationDetail(obligation) {
    switch (obligation.status) {
        case 'pending_build':
            return DETAIL.building;
        case 'ready_to_verify':
            return DETAIL.verificationPending;
        case 'verifying':
            return DETAIL.verifying;
        case 'verified':
            return formatVerifiedDetail(obligation.evidence);
        case 'needs_setup':
            return DETAIL.needsSetup;
        case 'not_verifiable':
            return obligation.executionIntent === 'one-off' && obligation.evidence?.attempted !== true
                ? DETAIL.verificationOptional
                : DETAIL.couldNotVerify;
        case 'blocked':
            return obligation.blockingReason ?? DETAIL.blocked;
    }
}
function obligationStatus(obligation) {
    switch (obligation.status) {
        case 'pending_build':
        case 'ready_to_verify':
        case 'verifying':
            return 'in_progress';
        case 'verified':
        case 'needs_setup':
        case 'not_verifiable':
            return 'done';
        case 'blocked':
            return 'failed';
    }
}
function projectedPlannedStatus(status) {
    switch (status) {
        case 'planned':
            return 'todo';
        case 'running':
            return 'in_progress';
        case 'succeeded':
            return 'done';
        case 'failed':
            return 'failed';
        case 'cancelled':
            return 'cancelled';
    }
}
function plannedBuildDetail(task) {
    if (task.kind !== 'build-workflow')
        return undefined;
    if (task.status === 'running')
        return DETAIL.building;
    if (task.status === 'failed')
        return task.error ?? DETAIL.blocked;
    if (task.status === 'cancelled')
        return task.error ?? DETAIL.cancelled;
    const outcome = (0, workflow_verification_obligation_service_1.parseWorkflowBuildOutcome)(task.outcome);
    if (!outcome)
        return task.status === 'succeeded' ? DETAIL.submitted : undefined;
    return outcome.submitted || outcome.workflowId ? DETAIL.submitted : undefined;
}
function verifyRow(buildTaskId, obligation) {
    if (obligation.status === 'pending_build') {
        return {
            id: verifyRowId(buildTaskId),
            description: VERIFY_DESCRIPTION,
            detail: DETAIL.waitingForBuild,
            status: 'todo',
        };
    }
    return {
        id: verifyRowId(buildTaskId),
        description: VERIFY_DESCRIPTION,
        detail: obligationDetail(obligation),
        status: obligationStatus(obligation),
    };
}
function buildRow(buildTaskId, outcome, obligation) {
    const submitted = outcome?.submitted === true || !!obligation.workflowId;
    const blockedBeforeSubmit = obligation.status === 'blocked' && !submitted;
    return {
        id: buildTaskId,
        description: BUILD_DESCRIPTION,
        detail: submitted ? DETAIL.submitted : obligationDetail(obligation),
        status: blockedBeforeSubmit ? 'failed' : submitted ? 'done' : 'in_progress',
    };
}
function directTaskItems(buildTaskId, outcome, obligation) {
    return [buildRow(buildTaskId, outcome, obligation), verifyRow(buildTaskId, obligation)];
}
function upsertTaskItemsInOrder(existingTasks, items) {
    const tasks = [...existingTasks];
    let changed = false;
    for (const [itemIndex, item] of items.entries()) {
        const existingIndex = tasks.findIndex((task) => task.id === item.id);
        if (existingIndex >= 0) {
            if (taskItemsEqual(tasks[existingIndex], item))
                continue;
            tasks[existingIndex] = item;
            changed = true;
            continue;
        }
        const previousItem = items[itemIndex - 1];
        const previousIndex = previousItem
            ? tasks.findIndex((task) => task.id === previousItem.id)
            : -1;
        tasks.splice(previousIndex >= 0 ? previousIndex + 1 : tasks.length, 0, item);
        changed = true;
    }
    return { tasks, changed };
}
function taskItemsEqual(first, second) {
    return (first.id === second.id &&
        first.description === second.description &&
        first.detail === second.detail &&
        first.status === second.status);
}
class WorkflowVerificationTaskProjector {
    constructor(agentMemory, eventBus, logger, obligations) {
        this.agentMemory = agentMemory;
        this.eventBus = eventBus;
        this.logger = logger;
        this.obligations = obligations;
    }
    async projectPlannedTaskList(threadId, graph) {
        const tasks = [];
        for (const task of graph.tasks) {
            tasks.push({
                id: task.id,
                description: task.title,
                detail: plannedBuildDetail(task),
                status: projectedPlannedStatus(task.status),
            });
            if (task.kind === 'build-workflow') {
                tasks.push(await this.projectPlannedVerifyRow(threadId, task));
            }
        }
        return { tasks };
    }
    async projectPlannedVerifyRow(threadId, task) {
        const id = verifyRowId(task.id);
        if (task.status === 'planned' || task.status === 'running') {
            return {
                id,
                description: VERIFY_DESCRIPTION,
                detail: DETAIL.waitingForBuild,
                status: 'todo',
            };
        }
        if (task.status === 'failed' || task.status === 'cancelled') {
            return {
                id,
                description: VERIFY_DESCRIPTION,
                detail: DETAIL.buildIncomplete,
                status: 'cancelled',
            };
        }
        const outcome = (0, workflow_verification_obligation_service_1.parseWorkflowBuildOutcome)(task.outcome);
        if (!outcome) {
            return {
                id,
                description: VERIFY_DESCRIPTION,
                detail: DETAIL.verificationPending,
                status: 'in_progress',
            };
        }
        const options = { source: 'planned', plannedTaskId: task.id };
        const obligation = (await this.obligations.getObligation(threadId, outcome.workItemId, options)) ??
            (0, instance_ai_1.deriveWorkflowVerificationObligationFromOutcome)(threadId, outcome, options);
        return verifyRow(task.id, obligation);
    }
    async syncFromBackgroundTask(task) {
        if (task.plannedTaskId || task.parentCheckpointId || task.role !== 'workflow-builder')
            return;
        const items = await this.directItemsFromTask(task);
        if (!items)
            return;
        await this.upsertItems(task.threadId, task.runId, items);
    }
    async directItemsFromTask(task) {
        const build = { id: task.taskId, description: BUILD_DESCRIPTION };
        const verify = { id: verifyRowId(task.taskId), description: VERIFY_DESCRIPTION };
        switch (task.status) {
            case 'running':
                return [
                    { ...build, detail: DETAIL.building, status: 'in_progress' },
                    { ...verify, detail: DETAIL.waitingForBuild, status: 'todo' },
                ];
            case 'failed':
                return [
                    { ...build, detail: task.error ?? DETAIL.blocked, status: 'failed' },
                    { ...verify, detail: DETAIL.buildIncomplete, status: 'cancelled' },
                ];
            case 'cancelled':
                return [
                    { ...build, detail: task.error ?? DETAIL.cancelled, status: 'cancelled' },
                    { ...verify, detail: DETAIL.buildIncomplete, status: 'cancelled' },
                ];
            case 'completed':
                return await this.directItemsFromCompletedTask(task, build, verify);
        }
    }
    async directItemsFromCompletedTask(task, build, verify) {
        const outcome = (0, workflow_verification_obligation_service_1.parseWorkflowBuildOutcome)(task.outcome);
        const workItemId = task.workItemId ?? outcome?.workItemId;
        if (!workItemId) {
            return [
                { ...build, detail: DETAIL.submitted, status: 'done' },
                { ...verify, detail: DETAIL.noWorkflow, status: 'cancelled' },
            ];
        }
        const obligation = await this.obligations.getObligation(task.threadId, workItemId, {
            source: 'direct',
        });
        if (!obligation)
            return undefined;
        return directTaskItems(task.taskId, outcome, obligation);
    }
    async syncFromWorkflowLoop(threadId, runId) {
        try {
            const taskStorage = new instance_ai_1.ThreadTaskStorage(this.agentMemory);
            const existing = await taskStorage.get(threadId);
            if (!existing?.tasks.length)
                return;
            const records = await new instance_ai_1.WorkflowLoopStorage(this.agentMemory).listWorkItems(threadId);
            const byBuildTaskId = new Map();
            for (const record of records) {
                if (this.obligations.isPlannedRecord(record))
                    continue;
                const obligation = this.obligations.obligationFromRecord(threadId, record, {
                    source: 'direct',
                });
                if (obligation.taskId) {
                    byBuildTaskId.set(obligation.taskId, { outcome: record.lastBuildOutcome, obligation });
                }
            }
            let tasks = existing.tasks;
            let changed = false;
            for (const task of existing.tasks) {
                const entry = byBuildTaskId.get(task.id);
                if (!entry)
                    continue;
                const update = upsertTaskItemsInOrder(tasks, directTaskItems(task.id, entry.outcome, entry.obligation));
                changed = changed || update.changed;
                tasks = update.tasks;
            }
            if (!changed)
                return;
            await this.saveAndPublish(taskStorage, threadId, runId, { tasks });
        }
        catch (error) {
            this.logger.warn('Failed to sync direct workflow builder task checklist items', {
                threadId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    async upsertItems(threadId, runId, items) {
        try {
            const taskStorage = new instance_ai_1.ThreadTaskStorage(this.agentMemory);
            const existing = (await taskStorage.get(threadId)) ?? { tasks: [] };
            const { tasks, changed } = upsertTaskItemsInOrder(existing.tasks, items);
            if (!changed)
                return;
            await this.saveAndPublish(taskStorage, threadId, runId, { tasks });
        }
        catch (error) {
            this.logger.warn('Failed to update direct workflow builder task checklist items', {
                threadId,
                taskIds: items.map((item) => item.id),
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
    }
    async saveAndPublish(taskStorage, threadId, runId, taskList) {
        await taskStorage.save(threadId, taskList);
        this.eventBus.publish(threadId, {
            type: 'tasks-update',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            payload: { tasks: taskList },
        });
    }
}
exports.WorkflowVerificationTaskProjector = WorkflowVerificationTaskProjector;
//# sourceMappingURL=workflow-verification-task-projector.js.map