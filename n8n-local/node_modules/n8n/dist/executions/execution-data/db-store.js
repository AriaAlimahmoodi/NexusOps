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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbStore = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const chunk_1 = __importDefault(require("lodash/chunk"));
const missing_execution_data_error_1 = require("./missing-execution-data.error");
const MAX_READ_BATCH_SIZE = 900;
let DbStore = class DbStore {
    constructor(repository) {
        this.repository = repository;
    }
    async write({ executionId }, payload, tx) {
        const repo = tx.getRepository(db_1.ExecutionData);
        await repo.upsert({ ...payload, executionId }, ['executionId']);
        return this.measureBundleBytes(payload);
    }
    async overwrite(ref, payload, tx) {
        const repo = tx.getRepository(db_1.ExecutionData);
        const result = await repo.update({ executionId: ref.executionId }, { data: payload.data, workflowData: payload.workflowData });
        if ((result.affected ?? 0) === 0)
            throw new missing_execution_data_error_1.MissingExecutionDataError(ref);
        return this.measureBundleBytes(payload);
    }
    measureBundleBytes(payload) {
        return (Buffer.byteLength(payload.data, 'utf8') +
            Buffer.byteLength(JSON.stringify(payload.workflowData), 'utf8') +
            Buffer.byteLength(payload.workflowVersionId ?? '', 'utf8'));
    }
    async read({ executionId }, tx) {
        const repo = tx ? tx.getRepository(db_1.ExecutionData) : this.repository;
        const result = await repo.findOne({
            where: { executionId },
            select: ['data', 'workflowData', 'workflowVersionId'],
        });
        return result;
    }
    async readWorkflowData({ executionId }, tx) {
        const repo = tx ? tx.getRepository(db_1.ExecutionData) : this.repository;
        const result = await repo.findOne({
            where: { executionId },
            select: ['workflowData', 'workflowVersionId'],
        });
        if (!result)
            return null;
        return { workflowData: result.workflowData, workflowVersionId: result.workflowVersionId };
    }
    async getDataByteSize({ executionId }) {
        const row = await this.repository
            .createQueryBuilder('d')
            .select('LENGTH(d.data)', 'size')
            .where('d.executionId = :executionId', { executionId })
            .getRawOne();
        if (!row || row.size === null)
            return null;
        return Number(row.size);
    }
    async readMany(refs) {
        const payloads = new Map();
        if (refs.length === 0)
            return payloads;
        const ids = refs.map((r) => r.executionId);
        for (const batch of (0, chunk_1.default)(ids, MAX_READ_BATCH_SIZE)) {
            const rows = await this.repository.find({
                where: { executionId: (0, db_1.In)(batch) },
                select: ['executionId', 'data', 'workflowData', 'workflowVersionId'],
            });
            for (const row of rows) {
                payloads.set(row.executionId, {
                    data: row.data,
                    workflowData: row.workflowData,
                    workflowVersionId: row.workflowVersionId,
                });
            }
        }
        return payloads;
    }
};
exports.DbStore = DbStore;
exports.DbStore = DbStore = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ExecutionDataRepository])
], DbStore);
//# sourceMappingURL=db-store.js.map