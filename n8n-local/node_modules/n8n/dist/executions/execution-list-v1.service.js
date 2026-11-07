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
exports.ExecutionListV1Service = exports.COMPLETED_STATUSES = exports.CURRENT_STATUSES = void 0;
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const execution_cursor_1 = require("./execution-cursor");
exports.CURRENT_STATUSES = ['new', 'running'];
exports.COMPLETED_STATUSES = n8n_workflow_1.ExecutionStatusList.filter((status) => !exports.CURRENT_STATUSES.includes(status));
let ExecutionListV1Service = class ExecutionListV1Service {
    constructor(databaseConfig, executionRepository) {
        this.databaseConfig = databaseConfig;
        this.executionRepository = executionRepository;
    }
    async findPageWithCount(query, cursor) {
        const pagedQuery = {
            ...query,
            range: { ...query.range, beforeId: cursor?.v1?.id ?? query.range.beforeId },
        };
        const { range: _, ...countQuery } = pagedQuery;
        const [results, executionCount] = await Promise.all([
            this.executionRepository.findManyByRangeQuery(pagedQuery),
            this.getExecutionsCountForQuery({ ...countQuery, kind: 'count' }),
        ]);
        return {
            results,
            nextCursor: this.nextCursorFor(results, pagedQuery.range.limit),
            ...executionCount,
        };
    }
    async findCurrentAndCompleted(query) {
        const { range: _, ...countQuery } = query;
        const [current, completed, completedCount] = await Promise.all([
            this.findCurrentExecutions(query),
            this.executionRepository.findManyByRangeQuery(query),
            this.getExecutionsCountForQuery({ ...countQuery, kind: 'count' }),
        ]);
        return {
            results: current.concat(completed),
            nextCursor: this.nextCursorFor(completed, query.range.limit),
            count: completedCount.count,
            estimated: completedCount.estimated,
        };
    }
    async findCurrentExecutions(query) {
        const currentQuery = {
            ...query,
            range: {
                limit: query.range.limit,
            },
            status: exports.CURRENT_STATUSES,
            order: { top: 'running' },
        };
        return await this.executionRepository.findManyByRangeQuery(currentQuery);
    }
    nextCursorFor(rows, limit) {
        if (rows.length < limit)
            return null;
        const lastRow = rows[rows.length - 1];
        if (!lastRow)
            return null;
        return (0, execution_cursor_1.encodeExecutionCursor)({
            version: 1,
            v1: {
                id: lastRow.id,
                timestamp: new Date(lastRow.startedAt ?? lastRow.createdAt).toISOString(),
            },
        });
    }
    async getExecutionsCountForQuery(countQuery) {
        if (this.databaseConfig.type === 'postgresdb') {
            const liveRows = await this.executionRepository.getLiveExecutionRowsOnPostgres();
            if (liveRows === -1)
                return { count: -1, estimated: false };
            if (liveRows > 100_000) {
                return { count: liveRows, estimated: true };
            }
        }
        const count = await this.executionRepository.fetchCount(countQuery);
        return { count, estimated: false };
    }
};
exports.ExecutionListV1Service = ExecutionListV1Service;
exports.ExecutionListV1Service = ExecutionListV1Service = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.DatabaseConfig, db_1.ExecutionRepository])
], ExecutionListV1Service);
//# sourceMappingURL=execution-list-v1.service.js.map