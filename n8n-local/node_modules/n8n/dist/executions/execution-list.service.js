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
exports.ExecutionListService = void 0;
const di_1 = require("@n8n/di");
const engine_data_plane_proxy_service_1 = require("../services/engine-data-plane-proxy.service");
const backend_services_1 = require("@n8n/backend-services");
const execution_cursor_1 = require("./execution-cursor");
const execution_list_v1_service_1 = require("./execution-list-v1.service");
let ExecutionListService = class ExecutionListService {
    constructor(v1Service, dataPlane, workflowSharingService, roleService) {
        this.v1Service = v1Service;
        this.dataPlane = dataPlane;
        this.workflowSharingService = workflowSharingService;
        this.roleService = roleService;
    }
    async listExecutionsForUI(query, cursor) {
        const combinesCurrentAndCompleted = !query.status?.length;
        const hasPositionInCursor = (0, execution_cursor_1.hasPosition)(cursor);
        const pageQuery = {
            ...query,
            order: { startedAt: 'DESC' },
            ...(combinesCurrentAndCompleted ? { status: execution_list_v1_service_1.COMPLETED_STATUSES } : {}),
        };
        const provider = await this.provider();
        return combinesCurrentAndCompleted && !hasPositionInCursor
            ? await provider.findCurrentAndCompleted(pageQuery)
            : await provider.findPageWithCount(pageQuery, cursor);
    }
    async findPageWithCount(query, cursor) {
        const provider = await this.provider();
        return await provider.findPageWithCount(query, cursor);
    }
    async addScopes(user, summaries) {
        const workflowIds = [...new Set(summaries.map((s) => s.workflowId))];
        const scopes = Object.fromEntries(await this.workflowSharingService.getSharedWorkflowScopes(workflowIds, user));
        for (const s of summaries) {
            s.scopes = scopes[s.workflowId] ?? [];
        }
    }
    async buildSharingOptions(scope) {
        const projectRoles = await this.roleService.rolesWithScope('project', [scope]);
        const workflowRoles = await this.roleService.rolesWithScope('workflow', [scope]);
        return { scopes: [scope], projectRoles, workflowRoles };
    }
    async provider() {
        if (!this.dataPlane.isAvailable())
            return this.v1Service;
        const { ExecutionListV2Service } = await import('./execution-list-v2.service.js');
        return di_1.Container.get(ExecutionListV2Service);
    }
};
exports.ExecutionListService = ExecutionListService;
exports.ExecutionListService = ExecutionListService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [execution_list_v1_service_1.ExecutionListV1Service, engine_data_plane_proxy_service_1.EngineDataPlaneProxyService, backend_services_1.WorkflowSharingService, backend_services_1.RoleService])
], ExecutionListService);
//# sourceMappingURL=execution-list.service.js.map