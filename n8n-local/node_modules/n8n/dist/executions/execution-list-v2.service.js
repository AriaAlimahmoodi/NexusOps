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
exports.ExecutionListV2Service = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const node_assert_1 = __importDefault(require("node:assert"));
const engine_data_plane_proxy_service_1 = require("../services/engine-data-plane-proxy.service");
const engine_v2_execution_reader_service_1 = require("./engine-v2-execution-reader.service");
const execution_id_1 = require("./execution-id");
const execution_list_v1_service_1 = require("./execution-list-v1.service");
const merge_execution_pages_1 = require("./merge-execution-pages");
class ExecutionListCtx {
    constructor(query, v2Reader, v2Scopes, cursor) {
        this.query = query;
        this.v2Reader = v2Reader;
        this.v2Scopes = v2Scopes;
        this.cursor = cursor;
    }
}
let ExecutionListV2Service = class ExecutionListV2Service {
    constructor(executionListV1Service, executionRepository, executionListRepository, reader, dataPlane) {
        this.executionListV1Service = executionListV1Service;
        this.executionRepository = executionRepository;
        this.executionListRepository = executionListRepository;
        this.reader = reader;
        this.dataPlane = dataPlane;
    }
    async findPageWithCount(query, cursor) {
        const ctx = await this.buildCtx(query, cursor);
        const result = await this.findPageMerged(ctx);
        await this.resolveWorkflowNames(result.results);
        return result;
    }
    async findCurrentAndCompleted(query) {
        const ctx = await this.buildCtx(query);
        const [currentMerged, completedMerged] = await Promise.all([
            this.findCurrentMerged(ctx),
            this.findPageMerged(ctx),
        ]);
        const results = currentMerged.concat(completedMerged.results);
        await this.resolveWorkflowNames(results);
        return {
            results,
            nextCursor: completedMerged.nextCursor,
            count: completedMerged.count,
            estimated: completedMerged.estimated,
        };
    }
    async findCurrentMerged(ctx) {
        const [v1Current, v2Current] = await Promise.all([
            this.executionListV1Service.findCurrentExecutions(ctx.query),
            this.findCurrentExecutionsV2(ctx),
        ]);
        return v1Current.concat(v2Current).sort((a, b) => {
            const aRunning = a.status === 'running';
            const bRunning = b.status === 'running';
            if (aRunning !== bRunning)
                return aRunning ? -1 : 1;
            return (0, api_types_1.compareExecutionListItems)(a, b);
        });
    }
    async findPageMerged(ctx) {
        const [v1Page, v2Page] = await Promise.all([this.v1Page(ctx), this.v2Page(ctx)]);
        const merged = (0, merge_execution_pages_1.mergeExecutionPages)([v1Page, v2Page], ctx.query.range.limit, ctx.cursor);
        return {
            results: merged.results,
            nextCursor: merged.nextCursor,
            count: v1Page.count === -1 ? -1 : v1Page.count + v2Page.total,
            estimated: v1Page.estimated,
        };
    }
    async resolveV2Scope(query) {
        if (query.metadata?.length ||
            query.annotationTags?.length ||
            query.vote ||
            query.workflowVersionId !== undefined)
            return null;
        const user = query.user;
        (0, node_assert_1.default)(user);
        if ((0, permissions_1.hasGlobalScope)(user, 'workflow:read') &&
            !query.workflowId &&
            !query.projectId &&
            query.isArchived === undefined &&
            !query.workflowBooleanSettings?.length)
            return 'all';
        return await this.executionListRepository.findWorkflowIdsForExecutionList(query);
    }
    async v1Page(ctx) {
        const { range: _, ...countQuery } = ctx.query;
        const [rows, executionCount] = await Promise.all([
            this.executionRepository.findManyByRangeQuery({
                ...ctx.query,
                range: {
                    limit: ctx.query.range.limit + 1,
                    beforeId: ctx.cursor?.v1?.id ?? ctx.query.range.beforeId,
                },
            }),
            this.executionListV1Service.getExecutionsCountForQuery({ ...countQuery, kind: 'count' }),
        ]);
        return {
            items: rows.slice(0, ctx.query.range.limit),
            hasMore: rows.length > ctx.query.range.limit,
            count: executionCount.count,
            estimated: executionCount.estimated,
        };
    }
    async v2Page(ctx) {
        if (!ctx.v2Scopes)
            return { items: [], total: 0, hasMore: false };
        return await ctx.v2Reader.findMany(this.toV2Query(ctx.query, ctx.cursor?.v2), ctx.v2Scopes, {
            includeTotal: true,
        });
    }
    toV2Query(query, before) {
        return {
            status: query.status,
            mode: query.mode,
            startedAfter: query.startedAfter,
            startedBefore: query.startedBefore,
            before,
            limit: query.range.limit,
        };
    }
    async resolveWorkflowNames(results) {
        const v2Results = results.filter((item) => (0, execution_id_1.isExecutionIdV2)(item.id));
        if (!v2Results.length)
            return;
        const uniqV2WorkflowIds = [...new Set(v2Results.map((item) => item.workflowId))];
        const workflowNames = await this.executionListRepository.findNamesForExecutionList(uniqV2WorkflowIds);
        const namesById = new Map(workflowNames.map((workflow) => [workflow.id, workflow.name]));
        for (const item of v2Results)
            item.workflowName = namesById.get(item.workflowId);
    }
    async findCurrentExecutionsV2(ctx) {
        if (!ctx.v2Scopes)
            return [];
        const currentExecutions = await ctx.v2Reader.findMany({
            ...this.toV2Query(ctx.query, ctx.cursor?.v2),
            status: execution_list_v1_service_1.CURRENT_STATUSES,
            order: { top: 'running' },
        }, ctx.v2Scopes);
        return currentExecutions.items;
    }
    async buildCtx(query, cursor) {
        (0, node_assert_1.default)(this.dataPlane.isAvailable());
        return new ExecutionListCtx(query, this.reader, await this.resolveV2Scope(query), cursor);
    }
};
exports.ExecutionListV2Service = ExecutionListV2Service;
exports.ExecutionListV2Service = ExecutionListV2Service = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [execution_list_v1_service_1.ExecutionListV1Service, db_1.ExecutionRepository, db_1.ExecutionListRepository, engine_v2_execution_reader_service_1.EngineV2ExecutionReader, engine_data_plane_proxy_service_1.EngineDataPlaneProxyService])
], ExecutionListV2Service);
//# sourceMappingURL=execution-list-v2.service.js.map