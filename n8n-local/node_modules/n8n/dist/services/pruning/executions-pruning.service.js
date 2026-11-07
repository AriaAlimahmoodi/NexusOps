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
exports.ExecutionsPruningService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const sleep_1 = require("@n8n/utils/sleep");
const execution_persistence_1 = require("../../executions/execution-persistence");
const BATCH_DELAY_MS = 1000;
let ExecutionsPruningService = class ExecutionsPruningService {
    constructor(logger, executionRepository, executionPersistence) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.executionPersistence = executionPersistence;
        this.logger = this.logger.scoped('pruning');
    }
    async softDelete() {
        const result = await this.executionRepository.softDeletePrunableExecutions();
        if (result.affected === 0) {
            this.logger.debug('Found no executions to soft-delete');
            return;
        }
        this.logger.debug('Soft-deleted executions', { count: result.affected });
    }
    async hardDelete(signal) {
        const { hardDeletionBatchSize } = this.executionRepository;
        let before;
        let deletedCount = 0;
        let hasMore = true;
        while (hasMore && !signal.aborted) {
            const refs = await this.executionRepository.findSoftDeletedExecutions(before);
            if (!signal.aborted) {
                deletedCount += await this.hardDeleteBatch(refs, signal);
            }
            hasMore = refs.length === hardDeletionBatchSize;
            if (hasMore) {
                before = refs.at(-1)?.executionId;
                await this.waitBetweenBatches(signal);
            }
        }
        this.logger.debug('Hard-deleted executions', { count: deletedCount });
    }
    async hardDeleteBatch(refs, signal) {
        try {
            await this.executionPersistence.hardDelete(refs);
            return refs.length;
        }
        catch (batchError) {
            const deleted = await this.hardDeleteOneByOne(refs, signal);
            if (deleted === 0)
                throw batchError;
            return deleted;
        }
    }
    async hardDeleteOneByOne(refs, signal) {
        const failedInBatch = [];
        let deleted = 0;
        for (const ref of refs) {
            if (signal.aborted)
                break;
            try {
                await this.executionPersistence.hardDelete(ref);
                deleted++;
            }
            catch {
                failedInBatch.push(ref.executionId);
            }
        }
        if (failedInBatch.length > 0) {
            this.logger.error('Failed to hard-delete executions', { executionIds: failedInBatch });
        }
        return deleted;
    }
    async waitBetweenBatches(signal) {
        try {
            await (0, sleep_1.sleep)(BATCH_DELAY_MS, signal);
        }
        catch {
        }
    }
};
exports.ExecutionsPruningService = ExecutionsPruningService;
exports.ExecutionsPruningService = ExecutionsPruningService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ExecutionRepository, execution_persistence_1.ExecutionPersistence])
], ExecutionsPruningService);
//# sourceMappingURL=executions-pruning.service.js.map