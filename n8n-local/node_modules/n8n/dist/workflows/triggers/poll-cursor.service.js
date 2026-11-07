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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollCursorService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const execution_persistence_1 = require("../../executions/execution-persistence");
const durable_poller_chain_1 = require("../../scheduling/poll-trigger-node/durable-poller-chain");
const toPollCursor = (cursor) => cursor;
let PollCursorService = class PollCursorService {
    constructor(logger, pollerStateRepository, transactionRunner, executionPersistence, schedulerConfig, workflowsConfig, eventService) {
        this.logger = logger;
        this.pollerStateRepository = pollerStateRepository;
        this.transactionRunner = transactionRunner;
        this.executionPersistence = executionPersistence;
        this.schedulerConfig = schedulerConfig;
        this.workflowsConfig = workflowsConfig;
        this.eventService = eventService;
        if (this.schedulerConfig.durableCursorsEnabled && !this.schedulerChainEnabled) {
            this.logger.warn('N8N_POLLER_DURABLE_CURSORS_ENABLED requires N8N_SCHEDULER_ENABLED, N8N_SCHEDULER_POLL_TRIGGERS_ENABLED and N8N_USE_WORKFLOW_PUBLICATION_SERVICE; durable poll cursors stay disabled.');
        }
    }
    get schedulerChainEnabled() {
        return (0, durable_poller_chain_1.isDurablePollerChainEnabled)(this.schedulerConfig, this.workflowsConfig);
    }
    async measureCommit(operation, commit) {
        const startedAt = performance.now();
        const emitSettled = (result) => {
            try {
                this.eventService.emit('poll-cursor-commit-settled', {
                    operation,
                    result,
                    durationMs: performance.now() - startedAt,
                });
            }
            catch {
            }
        };
        try {
            const { value, advanced } = await commit();
            emitSettled(advanced ? 'success' : 'fence_rejected');
            return value;
        }
        catch (error) {
            emitSettled('failure');
            throw error;
        }
    }
    get enabled() {
        return this.schedulerConfig.durableCursorsEnabled && this.schedulerChainEnabled;
    }
    async resolveCursor(workflowId, nodeId, nodeStaticData, prefetchedCursor) {
        if (!this.enabled) {
            const existing = await this.pollerStateRepository.findCursor(workflowId, nodeId);
            if (existing === null) {
                return { migrated: false };
            }
            return { migrated: true, cursor: toPollCursor(existing) };
        }
        if (prefetchedCursor !== undefined) {
            return { migrated: true, cursor: toPollCursor(prefetchedCursor) };
        }
        const stored = await this.transactionRunner.run({}, async (ctx) => await this.pollerStateRepository.getOrCreateCursor(workflowId, nodeId, nodeStaticData, ctx));
        return { migrated: true, cursor: toPollCursor(stored) };
    }
    async commitWithExecution(args) {
        const { workflowId, nodeId, cursor, payload, fence } = args;
        return await this.measureCommit('with_execution', async () => {
            if (this.enabled) {
                return await this.transactionRunner.run({}, async (ctx) => {
                    const advanced = await this.pollerStateRepository.advanceCursor(workflowId, nodeId, cursor, ctx, fence);
                    if (advanced) {
                        const executionId = await this.executionPersistence.create(payload, ctx);
                        return { value: { executionId }, advanced };
                    }
                    return { value: null, advanced };
                });
            }
            const advanced = await this.pollerStateRepository.advanceCursor(workflowId, nodeId, cursor, {}, fence);
            if (advanced) {
                const executionId = await this.executionPersistence.create(payload, {});
                return { value: { executionId }, advanced };
            }
            return { value: null, advanced };
        });
    }
    async commitCursorOnly(args) {
        const { workflowId, nodeId, cursor, fence } = args;
        return await this.measureCommit('cursor_only', async () => {
            const advanced = await this.pollerStateRepository.advanceCursor(workflowId, nodeId, cursor, {}, fence);
            return { value: advanced, advanced };
        });
    }
};
exports.PollCursorService = PollCursorService;
exports.PollCursorService = PollCursorService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.PollerStateRepository, db_1.TransactionRunner, execution_persistence_1.ExecutionPersistence, config_1.SchedulerConfig, config_1.WorkflowsConfig, backend_services_1.EventService])
], PollCursorService);
//# sourceMappingURL=poll-cursor.service.js.map