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
exports.EngineV2ExecutionReader = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const engine_data_plane_proxy_service_1 = require("../services/engine-data-plane-proxy.service");
const engine_v2_mapping_1 = require("./engine-v2-mapping");
const types_1 = require("./execution-data/types");
const MAX_SCOPE_SIZE = 10_000;
let EngineV2ExecutionReader = class EngineV2ExecutionReader {
    constructor(dataPlane) {
        this.dataPlane = dataPlane;
    }
    async findMany(query, scope, options = {}) {
        const { includeTotal = false } = options;
        if (scope !== 'all' && !scope.length)
            return this.empty();
        const status = (0, engine_v2_mapping_1.resolveV2Statuses)(query.status);
        if (status?.length === 0)
            return this.empty();
        const request = this.buildSearchRequest(query, this.searchableScope(scope), status, includeTotal);
        const page = await this.dataPlane.searchExecutions(request);
        return {
            items: page.items.map((item) => this.toExecutionSummary(item)),
            total: page.total ?? 0,
            hasMore: page.nextCursor !== null,
        };
    }
    empty() {
        return { items: [], hasMore: false, total: 0 };
    }
    searchableScope(scope) {
        if (scope === 'all')
            return scope;
        const ids = [...new Set(scope)];
        if (ids.length > MAX_SCOPE_SIZE) {
            throw new n8n_workflow_1.UserError(`Cannot search executions across more than ${MAX_SCOPE_SIZE} workflows. Filter by project or workflow.`);
        }
        return ids;
    }
    buildSearchRequest(query, scope, status, includeTotal) {
        return {
            workflowIds: scope,
            status,
            hostMode: query.mode,
            createdAfter: query.startedAfter ? new Date(query.startedAfter).toISOString() : undefined,
            createdBefore: query.startedBefore ? new Date(query.startedBefore).toISOString() : undefined,
            before: query.before ? { createdAt: query.before.timestamp, id: query.before.id } : undefined,
            limit: query.limit,
            includeTotal,
            order: query.order,
        };
    }
    toExecutionSummary(item) {
        return {
            id: item.id,
            workflowId: item.workflowId,
            status: (0, engine_v2_mapping_1.toV1Status)(item.status),
            mode: (0, engine_v2_mapping_1.toV1Mode)(item.hostMode),
            finished: item.status === 'completed',
            createdAt: new Date(item.createdAt),
            startedAt: new Date(item.createdAt),
            stoppedAt: item.finishedAt ? new Date(item.finishedAt) : undefined,
            annotation: { tags: [] },
        };
    }
    async findReference(executionId) {
        const snapshot = await this.dataPlane.getExecution(executionId, {
            includeSteps: false,
        });
        if (!snapshot)
            return undefined;
        if (snapshot.id !== executionId) {
            throw new n8n_workflow_1.UnexpectedError('The execution response does not match the requested execution.');
        }
        return { id: snapshot.id, workflowId: snapshot.workflowId };
    }
    async findOne(executionId, sharedWorkflowIds) {
        const snapshot = await this.dataPlane.getExecution(executionId, { includeSteps: true });
        if (!snapshot)
            return undefined;
        if (!sharedWorkflowIds.includes(snapshot.workflowId))
            return undefined;
        const workflow = asWorkflowSnapshot(snapshot.workflow);
        if (!workflow)
            return undefined;
        const { toV1RunExecutionData } = await import('@n8n/node-engine-compatibility');
        return this.toExecutionResponse(snapshot, workflow, toV1RunExecutionData(snapshot.graph, snapshot.steps ?? []));
    }
    toExecutionResponse(snapshot, workflow, data) {
        const startedAt = new Date(snapshot.createdAt);
        return {
            id: snapshot.id,
            workflowId: snapshot.workflowId,
            mode: (0, engine_v2_mapping_1.toV1Mode)(snapshot.hostMode),
            status: (0, engine_v2_mapping_1.toV1Status)(snapshot.status),
            finished: snapshot.status === 'completed',
            createdAt: startedAt,
            startedAt,
            stoppedAt: snapshot.finishedAt ? new Date(snapshot.finishedAt) : undefined,
            storedAt: 'db',
            data,
            workflowData: (0, types_1.toWorkflowSnapshot)(workflow),
            customData: {},
            annotation: { tags: [] },
        };
    }
};
exports.EngineV2ExecutionReader = EngineV2ExecutionReader;
exports.EngineV2ExecutionReader = EngineV2ExecutionReader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [engine_data_plane_proxy_service_1.EngineDataPlaneProxyService])
], EngineV2ExecutionReader);
function asWorkflowSnapshot(document) {
    if (typeof document !== 'object' || document === null)
        return undefined;
    if (!Array.isArray(document.nodes))
        return undefined;
    return document;
}
//# sourceMappingURL=engine-v2-execution-reader.service.js.map