"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowVerificationObligationService = void 0;
exports.parseWorkflowBuildOutcome = parseWorkflowBuildOutcome;
const instance_ai_1 = require("@n8n/instance-ai");
function parseWorkflowBuildOutcome(outcome) {
    const parsed = instance_ai_1.workflowBuildOutcomeSchema.safeParse(outcome);
    return parsed.success ? parsed.data : undefined;
}
class WorkflowVerificationObligationService {
    constructor(agentMemory, isSetupPanelEnabled = () => false) {
        this.agentMemory = agentMemory;
        this.isSetupPanelEnabled = isSetupPanelEnabled;
    }
    storage() {
        return new instance_ai_1.WorkflowLoopStorage(this.agentMemory);
    }
    isPlannedRecord(record) {
        return (0, instance_ai_1.isPlannedWorkflowBuildOwner)((0, instance_ai_1.resolveWorkflowBuildOwner)(record.state, record.lastBuildOutcome));
    }
    async getObligation(threadId, workItemId, options) {
        const record = await this.storage().getWorkItem(threadId, workItemId);
        if (!record)
            return undefined;
        return this.obligationFromRecord(threadId, record, options);
    }
    obligationFromRecord(threadId, record, options) {
        return (0, instance_ai_1.deriveWorkflowVerificationObligation)(threadId, record, {
            ...options,
            setupPanelEnabled: this.isSetupPanelEnabled(threadId),
        });
    }
    async findPendingPlannedWorkflowVerification(threadId, graph) {
        for (const task of graph.tasks) {
            if (task.kind !== 'build-workflow' || task.status !== 'succeeded')
                continue;
            const verification = await this.pendingPlannedWorkflowVerificationFromTask(threadId, task);
            if (verification)
                return verification;
        }
        return undefined;
    }
    async revalidatePlannedWorkflowVerification(threadId, verification) {
        return await this.pendingPlannedWorkflowVerificationFromTask(threadId, verification.task, verification.outcome);
    }
    async pendingPlannedWorkflowVerificationFromTask(threadId, task, fallbackOutcome) {
        const taskOutcome = parseWorkflowBuildOutcome(task.outcome);
        const baseOutcome = taskOutcome ?? fallbackOutcome;
        if (!baseOutcome)
            return undefined;
        const options = {
            source: 'planned',
            plannedTaskId: task.id,
            setupPanelEnabled: this.isSetupPanelEnabled(threadId),
        };
        const record = await this.storage().getWorkItem(threadId, baseOutcome.workItemId);
        const outcome = record?.lastBuildOutcome ?? baseOutcome;
        const obligation = record?.lastBuildOutcome
            ? this.obligationFromRecord(threadId, record, options)
            : (0, instance_ai_1.deriveWorkflowVerificationObligationFromOutcome)(threadId, outcome, options);
        if (!(0, instance_ai_1.isWorkflowVerificationObligationUnsettled)(obligation))
            return undefined;
        return { task, obligation, outcome };
    }
}
exports.WorkflowVerificationObligationService = WorkflowVerificationObligationService;
//# sourceMappingURL=workflow-verification-obligation-service.js.map