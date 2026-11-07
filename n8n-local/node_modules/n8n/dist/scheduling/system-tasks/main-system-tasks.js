"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainSystemTasks = mainSystemTasks;
const idempotency_key_cleanup_task_1 = require("../../public-api/idempotency-key-cleanup.task");
const activity_pruning_task_1 = require("../../services/pruning/activity-pruning.task");
const workflow_history_compaction_utils_1 = require("../../services/pruning/workflow-history-compaction.utils");
async function mainSystemTasks(globalConfig) {
    const { WorkflowHistoryCompactionOptimizeTask } = await import('../../services/pruning/workflow-history-compaction-optimize.task.js');
    const { WorkflowHistoryPruningTask } = await import('../../services/pruning/workflow-history-pruning.task.js');
    const { PendingAuthorizationCleanupTask } = await import('../../credentials/pending-authorization-cleanup.task.js');
    const tasks = [
        activity_pruning_task_1.ActivityPruningTask,
        WorkflowHistoryCompactionOptimizeTask,
        WorkflowHistoryPruningTask,
        PendingAuthorizationCleanupTask,
        idempotency_key_cleanup_task_1.IdempotencyKeyCleanupTask,
    ];
    if ((0, workflow_history_compaction_utils_1.isTrimmingEnabled)(globalConfig.workflowHistory, globalConfig.workflowHistoryCompaction)) {
        const { WorkflowHistoryCompactionTrimTask } = await import('../../services/pruning/workflow-history-compaction-trim.task.js');
        tasks.push(WorkflowHistoryCompactionTrimTask);
    }
    if (globalConfig.license.autoRenewalEnabled) {
        const { LicenseRenewalTask } = await import('../../license/license-renewal.task.js');
        tasks.push(LicenseRenewalTask);
    }
    if (globalConfig.executions.pruneData) {
        const { ExecutionPruningSoftDeleteTask } = await import('../../services/pruning/execution-pruning-soft-delete.task.js');
        const { ExecutionPruningHardDeleteTask } = await import('../../services/pruning/execution-pruning-hard-delete.task.js');
        tasks.push(ExecutionPruningSoftDeleteTask, ExecutionPruningHardDeleteTask);
    }
    if (globalConfig.diagnostics.enabled) {
        const { TelemetryPulseTask } = await import('../../telemetry/telemetry-pulse.task.js');
        tasks.push(TelemetryPulseTask);
    }
    if (globalConfig.workflows.useWorkflowPublicationService) {
        const { WorkflowPublicationOutboxCleanupTask } = await import('../../workflows/publication/workflow-publication-outbox-cleanup.task.js');
        tasks.push(WorkflowPublicationOutboxCleanupTask);
    }
    if (globalConfig.database.type === 'postgresdb') {
        const { WorkflowStatisticsRollupTask } = await import('../../services/workflow-statistics-rollup.task.js');
        tasks.push(WorkflowStatisticsRollupTask);
    }
    return tasks;
}
//# sourceMappingURL=main-system-tasks.js.map