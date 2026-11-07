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
exports.WorkflowPublisherService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const credential_sharing_1 = require("../constants/credential-sharing");
let WorkflowPublisherService = class WorkflowPublisherService {
    constructor(logger, publishHistoryRepository) {
        this.logger = logger;
        this.publishHistoryRepository = publishHistoryRepository;
    }
    async findActingUserIdForRestart(execution) {
        const manualUserId = execution.data.manualData?.userId;
        if (manualUserId)
            return manualUserId;
        if (!execution.workflowData.id)
            return undefined;
        return await this.findPublisherUserId(execution.workflowData.id, execution.workflowData.versionId);
    }
    async findPublisherUserId(workflowId, executedVersionId) {
        if (!(0, credential_sharing_1.isCredSharingEnabled)())
            return undefined;
        if (!executedVersionId) {
            this.logger.debug('Triggered execution has no version to attribute it to', { workflowId });
            return undefined;
        }
        let publisherUserId;
        try {
            publisherUserId = await this.publishHistoryRepository.findPublisherUserId(workflowId, executedVersionId);
        }
        catch (error) {
            this.logger.warn('Failed to resolve the publishing user for a triggered execution', {
                workflowId,
                error: (0, ensure_error_1.ensureError)(error).message,
            });
            return undefined;
        }
        if (!publisherUserId) {
            this.logger.debug('Triggered execution has no publishing user to attribute it to', {
                workflowId,
            });
        }
        return publisherUserId;
    }
};
exports.WorkflowPublisherService = WorkflowPublisherService;
exports.WorkflowPublisherService = WorkflowPublisherService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.WorkflowPublishHistoryRepository])
], WorkflowPublisherService);
//# sourceMappingURL=workflow-publisher.service.js.map