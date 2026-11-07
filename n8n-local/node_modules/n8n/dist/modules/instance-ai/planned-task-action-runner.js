"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlannedTaskActionRunner = void 0;
const instance_ai_1 = require("@n8n/instance-ai");
const nanoid_1 = require("nanoid");
class PlannedTaskActionRunner {
    constructor(deps) {
        this.deps = deps;
    }
    async run(action) {
        switch (action.type) {
            case 'replan':
                return await this.runReplan(action);
            case 'orchestrate-workflow-verification':
                return await this.runWorkflowVerification(action);
            case 'synthesize':
                return await this.runSynthesize(action);
            case 'orchestrate-build-workflow':
                return await this.runWorkflowBuild(action);
            case 'orchestrate-checkpoint':
                return await this.runCheckpoint(action);
            case 'dispatch':
                return await this.runDispatch(action);
        }
    }
    async runReplan(action) {
        const { scope } = this.deps;
        await this.deps.view.sync(scope, action.graph);
        const startedRunId = await this.deps.followUps.startReplan({
            scope,
            graph: action.graph,
            failedTask: action.failedTask,
        });
        if (!startedRunId) {
            await this.deps.plannedTaskService.revertToActive(scope.threadId);
        }
        return { type: 'done' };
    }
    async runWorkflowVerification(action) {
        const { scope } = this.deps;
        const { verification } = action;
        this.deps.workflowVerificationTracker.scheduled(verification);
        const currentVerification = await this.deps.workflowVerificationGate.revalidate(verification);
        if (!currentVerification) {
            this.deps.workflowVerificationTracker.followUpStartAttempted(verification, false);
            return { type: 'continue-scheduling' };
        }
        await this.deps.view.sync(scope, action.graph);
        const startedRunId = await this.deps.followUps.startWorkflowVerification({
            scope,
            graph: action.graph,
            verification: currentVerification,
        });
        this.deps.workflowVerificationTracker.followUpStartAttempted(currentVerification, startedRunId.length > 0);
        return { type: 'done' };
    }
    async runSynthesize(action) {
        const { scope } = this.deps;
        await this.deps.view.sync(scope, action.graph);
        const startedRunId = await this.deps.followUps.startSynthesis({ scope, graph: action.graph });
        if (!startedRunId) {
            await this.deps.plannedTaskService.revertToActive(scope.threadId);
        }
        return { type: 'done' };
    }
    async runWorkflowBuild(action) {
        const { scope } = this.deps;
        if (this.deps.runGate.hasLiveRun(scope.threadId))
            return { type: 'done' };
        const buildTask = action.tasks[0];
        if (!buildTask) {
            this.deps.logger.warn('Build workflow scheduler action had no task to run', {
                threadId: scope.threadId,
                planRunId: action.graph.planRunId,
            });
            return { type: 'done' };
        }
        const workItemId = buildTask.workflowId
            ? `${action.graph.planRunId}:default`
            : `wi_${(0, nanoid_1.nanoid)(8)}`;
        await this.deps.plannedTaskService.markRunning(scope.threadId, buildTask.id, {
            agentId: (0, instance_ai_1.orchestratorAgentId)(action.graph.planRunId),
        });
        const graphAfterMark = (await this.deps.plannedTaskService.getGraph(scope.threadId)) ?? action.graph;
        await this.deps.view.sync(scope, graphAfterMark);
        const buildTaskRecord = graphAfterMark.tasks.find((t) => t.id === buildTask.id) ?? buildTask;
        const startedRunId = await this.deps.followUps.startWorkflowBuild({
            scope,
            graph: graphAfterMark,
            task: buildTaskRecord,
            workItemId,
        });
        if (!startedRunId) {
            this.deps.logger.warn('Build workflow follow-up run did not start - reverting build task to planned for retry', { threadId: scope.threadId, buildTaskId: buildTask.id });
            await this.deps.plannedTaskService.revertBuildWorkflowToPlanned(scope.threadId, buildTask.id);
        }
        return { type: 'done' };
    }
    async runCheckpoint(action) {
        const { scope } = this.deps;
        if (this.deps.runGate.hasLiveRun(scope.threadId))
            return { type: 'done' };
        const checkpoint = action.tasks[0];
        if (!checkpoint) {
            this.deps.logger.warn('Checkpoint scheduler action had no task to run', {
                threadId: scope.threadId,
                planRunId: action.graph.planRunId,
            });
            return { type: 'done' };
        }
        await this.deps.plannedTaskService.markRunning(scope.threadId, checkpoint.id, {
            agentId: (0, instance_ai_1.orchestratorAgentId)(action.graph.planRunId),
        });
        const graphAfterMark = (await this.deps.plannedTaskService.getGraph(scope.threadId)) ?? action.graph;
        await this.deps.view.sync(scope, graphAfterMark);
        const checkpointRecord = graphAfterMark.tasks.find((t) => t.id === checkpoint.id) ?? checkpoint;
        const startedRunId = await this.deps.followUps.startCheckpoint({
            scope,
            graph: graphAfterMark,
            task: checkpointRecord,
        });
        if (!startedRunId) {
            this.deps.logger.warn('Checkpoint follow-up run did not start - reverting checkpoint to planned for retry', { threadId: scope.threadId, checkpointTaskId: checkpoint.id });
            await this.deps.plannedTaskService.revertCheckpointToPlanned(scope.threadId, checkpoint.id);
        }
        return { type: 'done' };
    }
    async runDispatch(action) {
        await this.deps.dispatcher.dispatch({
            scope: this.deps.scope,
            graph: action.graph,
            tasks: action.tasks,
        });
        return { type: 'continue-scheduling' };
    }
}
exports.PlannedTaskActionRunner = PlannedTaskActionRunner;
//# sourceMappingURL=planned-task-action-runner.js.map