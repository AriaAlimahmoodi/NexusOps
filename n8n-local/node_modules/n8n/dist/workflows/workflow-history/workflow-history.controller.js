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
exports.WorkflowHistoryController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const shared_workflow_not_found_error_1 = require("../../errors/shared-workflow-not-found.error");
const workflow_history_version_not_found_error_1 = require("../../errors/workflow-history-version-not-found.error");
const workflow_history_service_1 = require("./workflow-history.service");
let WorkflowHistoryController = class WorkflowHistoryController {
    constructor(historyService) {
        this.historyService = historyService;
    }
    async getList(req, _res, query) {
        try {
            return await this.historyService.getList(req.user, req.params.workflowId, query.take ?? api_types_1.WORKFLOW_HISTORY_DEFAULT_TAKE, query.skip ?? 0);
        }
        catch (e) {
            if (e instanceof shared_workflow_not_found_error_1.SharedWorkflowNotFoundError) {
                throw new errors_1.NotFoundError('Could not find workflow');
            }
            throw e;
        }
    }
    async getVersion(req) {
        try {
            return await this.historyService.getVersion(req.user, req.params.workflowId, req.params.versionId, { publishHistory: 'latestActivation' });
        }
        catch (e) {
            if (e instanceof shared_workflow_not_found_error_1.SharedWorkflowNotFoundError) {
                throw new errors_1.NotFoundError('Could not find workflow');
            }
            else if (e instanceof workflow_history_version_not_found_error_1.WorkflowHistoryVersionNotFoundError) {
                throw new errors_1.NotFoundError('Could not find version');
            }
            throw e;
        }
    }
    async getVersionsByIds(req, _res, body) {
        try {
            const versions = await this.historyService.getVersionsByIds(req.user, req.params.workflowId, body.versionIds);
            return { versions };
        }
        catch (e) {
            if (e instanceof shared_workflow_not_found_error_1.SharedWorkflowNotFoundError) {
                throw new errors_1.NotFoundError('Could not find workflow');
            }
            throw e;
        }
    }
    async getPublishTimeline(req, _res, query) {
        try {
            return await this.historyService.getPublishTimeline(req.user, req.params.workflowId, {
                offset: query.skip,
                limit: query.take,
            });
        }
        catch (e) {
            if (e instanceof shared_workflow_not_found_error_1.SharedWorkflowNotFoundError) {
                throw new errors_1.NotFoundError('Could not find workflow');
            }
            throw e;
        }
    }
    async updateVersion(req, _res, workflowId, versionId, body) {
        try {
            return await this.historyService.updateVersionForUser(req.user, workflowId, versionId, body);
        }
        catch (e) {
            if (e instanceof shared_workflow_not_found_error_1.SharedWorkflowNotFoundError) {
                throw new errors_1.NotFoundError('Could not find workflow');
            }
            else if (e instanceof workflow_history_version_not_found_error_1.WorkflowHistoryVersionNotFoundError) {
                throw new errors_1.NotFoundError('Could not find version');
            }
            throw e;
        }
    }
};
exports.WorkflowHistoryController = WorkflowHistoryController;
__decorate([
    (0, decorators_1.Get)('/workflow/:workflowId'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], WorkflowHistoryController.prototype, "getList", null);
__decorate([
    (0, decorators_1.Get)('/workflow/:workflowId/version/:versionId'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowHistoryController.prototype, "getVersion", null);
__decorate([
    (0, decorators_1.Post)('/workflow/:workflowId/versions'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.WorkflowHistoryVersionsByIdsDto]),
    __metadata("design:returntype", Promise)
], WorkflowHistoryController.prototype, "getVersionsByIds", null);
__decorate([
    (0, decorators_1.Get)('/workflow/:workflowId/publish-timeline'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.WorkflowPublishTimelineQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowHistoryController.prototype, "getPublishTimeline", null);
__decorate([
    (0, decorators_1.Licensed)('feat:namedVersions'),
    (0, decorators_1.Patch)('/workflow/:workflowId/versions/:versionId'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, (0, decorators_1.Param)('versionId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, String, String, api_types_1.UpdateWorkflowHistoryVersionDto]),
    __metadata("design:returntype", Promise)
], WorkflowHistoryController.prototype, "updateVersion", null);
exports.WorkflowHistoryController = WorkflowHistoryController = __decorate([
    (0, decorators_1.RestController)('/workflow-history'),
    __metadata("design:paramtypes", [workflow_history_service_1.WorkflowHistoryService])
], WorkflowHistoryController);
//# sourceMappingURL=workflow-history.controller.js.map