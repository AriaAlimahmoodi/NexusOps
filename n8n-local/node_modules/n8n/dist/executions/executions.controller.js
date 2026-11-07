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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const license_1 = require("../license");
const utils_1 = require("../utils");
const backend_services_1 = require("@n8n/backend-services");
const execution_id_1 = require("./execution-id");
const execution_list_service_1 = require("./execution-list.service");
const execution_service_1 = require("./execution.service");
const execution_service_ee_1 = require("./execution.service.ee");
const parse_range_query_middleware_1 = require("./parse-range-query.middleware");
const validation_1 = require("./validation");
let ExecutionsController = class ExecutionsController {
    constructor(executionService, enterpriseExecutionService, workflowSharingService, license, executionListService) {
        this.executionService = executionService;
        this.enterpriseExecutionService = enterpriseExecutionService;
        this.workflowSharingService = workflowSharingService;
        this.license = license;
        this.executionListService = executionListService;
    }
    async getAccessibleWorkflowIds(user, scope) {
        return await this.workflowSharingService.getSharedWorkflowIds(user, { scopes: [scope] });
    }
    async getMany(req) {
        const { rangeQuery: query, cursor } = req;
        query.user = req.user;
        query.sharingOptions = await this.executionListService.buildSharingOptions('execution:read');
        if (!this.license.isAdvancedExecutionFiltersEnabled()) {
            delete query.metadata;
            delete query.annotationTags;
        }
        const [executions, concurrentExecutionsCount] = await Promise.all([
            this.executionListService.listExecutionsForUI(query, cursor),
            this.executionService.getConcurrentExecutionsCount(),
        ]);
        await this.executionListService.addScopes(req.user, executions.results);
        return {
            ...executions,
            concurrentExecutionsCount,
        };
    }
    async getVersions(req) {
        const accessibleWorkflowIds = await this.getAccessibleWorkflowIds(req.user, 'execution:read');
        if (!accessibleWorkflowIds.includes(req.params.workflowId)) {
            return [];
        }
        return await this.executionService.getExecutedVersions(req.params.workflowId);
    }
    async getOne(req) {
        this.assertKnownExecutionId(req.params.id);
        const workflowIds = await this.getAccessibleWorkflowIds(req.user, 'execution:read');
        if (workflowIds.length === 0)
            throw new errors_1.NotFoundError('Execution not found');
        return this.license.isSharingEnabled()
            ? await this.enterpriseExecutionService.findOne(req, workflowIds)
            : await this.executionService.findOne(req, workflowIds);
    }
    async stop(req) {
        const workflowIds = await this.getAccessibleWorkflowIds(req.user, 'workflow:execute');
        if (workflowIds.length === 0)
            throw new errors_1.NotFoundError('Execution not found');
        const executionId = req.params.id;
        return await this.executionService.stop(executionId, workflowIds);
    }
    async stopMany(req) {
        const accessibleWorkflowIds = await this.getAccessibleWorkflowIds(req.user, 'workflow:execute');
        if (accessibleWorkflowIds.length === 0)
            return { stopped: 0 };
        const stopped = await this.executionService.stopMany(req.body.filter, accessibleWorkflowIds);
        return { stopped };
    }
    async retry(req) {
        const workflowIds = await this.getAccessibleWorkflowIds(req.user, 'workflow:execute');
        if (workflowIds.length === 0)
            throw new errors_1.NotFoundError('Execution not found');
        const redactQuery = api_types_1.ExecutionRedactionQueryDtoSchema.safeParse(req.query);
        return await this.executionService.retry({
            executionId: req.params.id,
            options: {
                loadWorkflow: req.body.loadWorkflow,
                redactExecutionData: redactQuery.success ? redactQuery.data.redactExecutionData : undefined,
            },
            sharedWorkflowIds: workflowIds,
            user: req.user,
        });
    }
    async delete(req, _res, payload) {
        const workflowIds = await this.getAccessibleWorkflowIds(req.user, 'execution:delete');
        if (workflowIds.length === 0)
            throw new errors_1.NotFoundError('Execution not found');
        return await this.executionService.delete(req.user, payload, workflowIds);
    }
    async update(req) {
        this.assertKnownExecutionId(req.params.id);
        const workflowIds = await this.getAccessibleWorkflowIds(req.user, 'execution:read');
        if (workflowIds.length === 0)
            throw new errors_1.NotFoundError('Execution not found');
        if ((0, execution_id_1.isExecutionIdV2)(req.params.id)) {
            throw new errors_1.NotImplementedError('Annotating engine v2 executions is not supported yet');
        }
        const { body: payload } = req;
        const validatedPayload = (0, validation_1.validateExecutionUpdatePayload)(payload);
        await this.executionService.annotate(req.params.id, validatedPayload, workflowIds);
        return await this.executionService.findOne(req, workflowIds);
    }
    assertKnownExecutionId(id) {
        if (!(0, utils_1.isPositiveInteger)(id) && !(0, execution_id_1.isExecutionIdV2)(id)) {
            throw new errors_1.BadRequestError('Execution ID is not valid');
        }
    }
};
exports.ExecutionsController = ExecutionsController;
__decorate([
    (0, decorators_1.Get)('/', { middlewares: [parse_range_query_middleware_1.parseRangeQuery] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExecutionsController.prototype, "getMany", null);
__decorate([
    (0, decorators_1.Get)('/versions/:workflowId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExecutionsController.prototype, "getVersions", null);
__decorate([
    (0, decorators_1.Get)('/:id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExecutionsController.prototype, "getOne", null);
__decorate([
    (0, decorators_1.Post)('/:id/stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExecutionsController.prototype, "stop", null);
__decorate([
    (0, decorators_1.Post)('/stopMany'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExecutionsController.prototype, "stopMany", null);
__decorate([
    (0, decorators_1.Post)('/:id/retry'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExecutionsController.prototype, "retry", null);
__decorate([
    (0, decorators_1.Post)('/delete'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.DeleteExecutionsDto]),
    __metadata("design:returntype", Promise)
], ExecutionsController.prototype, "delete", null);
__decorate([
    (0, decorators_1.Patch)('/:id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExecutionsController.prototype, "update", null);
exports.ExecutionsController = ExecutionsController = __decorate([
    (0, decorators_1.RestController)('/executions'),
    __metadata("design:paramtypes", [execution_service_1.ExecutionService, execution_service_ee_1.EnterpriseExecutionsService, backend_services_1.WorkflowSharingService, license_1.License, execution_list_service_1.ExecutionListService])
], ExecutionsController);
//# sourceMappingURL=executions.controller.js.map