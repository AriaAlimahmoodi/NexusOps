"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InterruptedRunSweeper_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterruptedRunSweeper = exports.AGENT_INTERRUPTED_MESSAGE = exports.TOOL_INTERRUPTED_MESSAGE = void 0;
exports.collectOrphanedSpawnedAgents = collectOrphanedSpawnedAgents;
exports.collectInFlightToolCalls = collectInFlightToolCalls;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const n8n_core_1 = require("n8n-core");
const durable_log_metrics_1 = require("./durable-log-metrics");
const in_process_event_bus_1 = require("./in-process-event-bus");
const instance_ai_checkpoint_repository_1 = require("../repositories/instance-ai-checkpoint.repository");
const instance_ai_event_log_repository_1 = require("../repositories/instance-ai-event-log.repository");
exports.TOOL_INTERRUPTED_MESSAGE = 'Interrupted by a process restart — effect unverified; verify before retrying.';
exports.AGENT_INTERRUPTED_MESSAGE = 'Interrupted by a process restart.';
let InterruptedRunSweeper = InterruptedRunSweeper_1 = class InterruptedRunSweeper {
    constructor(logger, eventLogRepo, checkpointRepo, eventBus, metrics, instanceSettings) {
        this.logger = logger;
        this.eventLogRepo = eventLogRepo;
        this.checkpointRepo = checkpointRepo;
        this.eventBus = eventBus;
        this.metrics = metrics;
        this.instanceSettings = instanceSettings;
        this.logger = this.logger.scoped('instance-ai');
    }
    setResumeHost(host) {
        this.resumeHost = host;
    }
    async sweep() {
        let unfinished;
        try {
            unfinished = await this.eventLogRepo.findUnfinishedRuns();
        }
        catch (error) {
            this.logger.error('Interrupted-run sweep failed to query the event log', { error });
            return;
        }
        for (const { threadId, runId } of unfinished) {
            try {
                await this.sweepRun(threadId, runId);
            }
            catch (error) {
                this.logger.error('Interrupted-run sweep failed for run', { threadId, runId, error });
            }
        }
    }
    async sweepRun(threadId, runId) {
        this.metrics.recordSweepRunExamined();
        const inFlightToolCalls = await this.resolveZombieRun(threadId, runId, {
            status: 'interrupted',
            reason: 'crash_interrupted',
        });
        if (inFlightToolCalls === null)
            return;
        this.metrics.recordSweepOutcome('interrupted', inFlightToolCalls);
        this.logger.info('Marked interrupted Instance AI run in the durable log', {
            threadId,
            runId,
            inFlightToolCalls,
        });
    }
    async cancelUnfinishedRuns(threadId) {
        let unfinished;
        try {
            unfinished = await this.eventLogRepo.findUnfinishedRuns(threadId);
        }
        catch (error) {
            this.logger.error('Cancel-time zombie resolution failed to query the event log', { error });
            return 0;
        }
        let resolved = 0;
        for (const run of unfinished) {
            try {
                const inFlightToolCalls = await this.resolveZombieRun(threadId, run.runId, {
                    status: 'cancelled',
                    reason: 'user_cancelled',
                });
                if (inFlightToolCalls === null)
                    continue;
                resolved++;
                this.logger.info('Cancelled a dead Instance AI run in the durable log', {
                    threadId,
                    runId: run.runId,
                    inFlightToolCalls,
                });
            }
            catch (error) {
                this.logger.error('Cancel-time zombie resolution failed for run', {
                    threadId,
                    runId: run.runId,
                    error,
                });
            }
        }
        return resolved;
    }
    async resolveZombieRun(threadId, runId, finish) {
        if (this.resumeHost?.isRunLive(threadId, runId))
            return null;
        const checkpoints = await this.checkpointRepo.findActiveByThreadId(threadId);
        const subAgentPrefix = (0, instance_ai_1.createSubAgentResourceIdPrefix)(threadId);
        const runCheckpoints = checkpoints.filter((row) => !row.resourceId?.startsWith(subAgentPrefix) && row.hostRunId === runId);
        if (runCheckpoints.some((row) => row.state?.status === 'suspended'))
            return null;
        if (this.instanceSettings.isMultiMain) {
            const cutoff = Date.now() - InterruptedRunSweeper_1.LIVENESS_GRACE_MS;
            const lastFact = await this.eventLogRepo.lastFactAt(threadId, runId);
            const newestCheckpointAt = runCheckpoints
                .map((row) => row.updatedAt?.getTime() ?? 0)
                .reduce((a, b) => Math.max(a, b), 0);
            const lastActivity = Math.max(lastFact?.getTime() ?? 0, newestCheckpointAt);
            if (lastActivity > cutoff)
                return null;
        }
        const events = await this.eventLogRepo.getForRuns(threadId, [runId]);
        if (events.some((event) => event.type === 'run-finish'))
            return null;
        const inFlight = collectInFlightToolCalls(events);
        for (const call of inFlight) {
            this.eventBus.publish(threadId, {
                type: 'tool-interrupted',
                runId,
                agentId: call.agentId,
                payload: { toolCallId: call.toolCallId, error: exports.TOOL_INTERRUPTED_MESSAGE },
            });
            this.metrics.recordSweepToolInterruptedFact();
        }
        for (const agent of collectOrphanedSpawnedAgents(events)) {
            this.eventBus.publish(threadId, {
                type: 'agent-completed',
                runId,
                agentId: agent.agentId,
                payload: {
                    role: agent.role,
                    result: '',
                    ...(finish.status === 'cancelled'
                        ? { status: 'cancelled' }
                        : { error: exports.AGENT_INTERRUPTED_MESSAGE }),
                },
            });
        }
        this.eventBus.publish(threadId, {
            type: 'run-finish',
            runId,
            agentId: (0, instance_ai_1.orchestratorAgentId)(runId),
            payload: finish,
        });
        return inFlight.length;
    }
};
exports.InterruptedRunSweeper = InterruptedRunSweeper;
InterruptedRunSweeper.LIVENESS_GRACE_MS = 2 * 60 * 1000;
exports.InterruptedRunSweeper = InterruptedRunSweeper = InterruptedRunSweeper_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, instance_ai_event_log_repository_1.InstanceAiEventLogRepository, instance_ai_checkpoint_repository_1.InstanceAiCheckpointRepository, in_process_event_bus_1.InProcessEventBus, durable_log_metrics_1.DurableLogMetrics, n8n_core_1.InstanceSettings])
], InterruptedRunSweeper);
function collectOrphanedSpawnedAgents(events) {
    const open = new Map();
    for (const event of events) {
        if (event.type === 'agent-spawned') {
            open.set(event.agentId, { agentId: event.agentId, role: event.payload.role });
        }
        else if (event.type === 'agent-completed') {
            open.delete(event.agentId);
        }
    }
    return [...open.values()];
}
function collectInFlightToolCalls(events) {
    const open = new Map();
    for (const event of events) {
        if (event.type === 'tool-call') {
            open.set(event.payload.toolCallId, {
                toolCallId: event.payload.toolCallId,
                toolName: event.payload.toolName,
                agentId: event.agentId,
                args: event.payload.args,
            });
        }
        else if (event.type === 'tool-result' ||
            event.type === 'tool-error' ||
            event.type === 'tool-interrupted') {
            open.delete(event.payload.toolCallId);
        }
    }
    return [...open.values()];
}
//# sourceMappingURL=interrupted-run-sweeper.js.map