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
exports.InstanceAiTemporaryWorkflowService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const instance_ai_adapter_service_1 = require("./instance-ai.adapter.service");
const instance_ai_thread_repository_1 = require("./repositories/instance-ai-thread.repository");
let InstanceAiTemporaryWorkflowService = class InstanceAiTemporaryWorkflowService {
    constructor(logger, adapterService, threadRepo, userRepository, aiBuilderTemporaryWorkflowRepository) {
        this.adapterService = adapterService;
        this.threadRepo = threadRepo;
        this.userRepository = userRepository;
        this.aiBuilderTemporaryWorkflowRepository = aiBuilderTemporaryWorkflowRepository;
        this.logger = logger.scoped('instance-ai');
    }
    async reapForRun(threadId, user, createdWorkflowIds, runningTaskCount) {
        if (runningTaskCount > 0) {
            this.logger.debug('Deferring AI-builder temporary workflow cleanup until tasks settle', {
                threadId,
                runningTaskCount,
            });
            return [];
        }
        let markedWorkflows = [];
        try {
            markedWorkflows = await this.aiBuilderTemporaryWorkflowRepository.findByThread(threadId);
        }
        catch (error) {
            this.logger.warn('Failed to inspect AI-builder temporary workflows during run finish', {
                threadId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
        }
        const workflowIds = new Set([
            ...markedWorkflows.map(({ workflowId }) => workflowId),
            ...(createdWorkflowIds ?? []),
        ]);
        if (workflowIds.size === 0)
            return [];
        return await this.archive(threadId, user, workflowIds);
    }
    async reapForThreadCleanup(threadId) {
        let markedWorkflows;
        try {
            markedWorkflows = await this.aiBuilderTemporaryWorkflowRepository.findByThread(threadId);
        }
        catch (error) {
            this.logger.warn('Failed to inspect AI-builder temporary workflows during thread cleanup', {
                threadId,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return;
        }
        if (markedWorkflows.length === 0)
            return;
        let thread;
        try {
            thread = await this.threadRepo.findOneBy({ id: threadId });
        }
        catch (error) {
            this.logger.warn('Failed to load thread owner for AI-builder temporary workflow cleanup', {
                threadId,
                markedWorkflowCount: markedWorkflows.length,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return;
        }
        if (!thread?.resourceId) {
            this.logger.warn('Skipping AI-builder temporary workflow cleanup for thread without owner', {
                threadId,
                markedWorkflowCount: markedWorkflows.length,
            });
            return;
        }
        let user;
        try {
            user = await this.userRepository.findOneBy({ id: thread.resourceId });
        }
        catch (error) {
            this.logger.warn('Failed to load user for AI-builder temporary workflow cleanup', {
                threadId,
                userId: thread.resourceId,
                markedWorkflowCount: markedWorkflows.length,
                error: (0, get_error_message_1.getErrorMessage)(error),
            });
            return;
        }
        if (!user) {
            this.logger.warn('Skipping AI-builder temporary workflow cleanup for missing thread owner', {
                threadId,
                userId: thread.resourceId,
                markedWorkflowCount: markedWorkflows.length,
            });
            return;
        }
        await this.archive(threadId, user, new Set(markedWorkflows.map(({ workflowId }) => workflowId)));
    }
    async archive(threadId, user, workflowIds) {
        const { configEvalsEnabled } = await this.adapterService.resolveExperimentGates(user);
        const adapter = this.adapterService.createContext(user, { threadId, configEvalsEnabled });
        const archived = [];
        for (const workflowId of workflowIds) {
            try {
                const didArchive = await adapter.workflowService.archiveIfAiTemporary(workflowId);
                if (didArchive)
                    archived.push(workflowId);
            }
            catch (error) {
                this.logger.warn('Failed to reap AI-builder temporary workflow', {
                    threadId,
                    workflowId,
                    error: (0, get_error_message_1.getErrorMessage)(error),
                });
            }
        }
        return archived;
    }
};
exports.InstanceAiTemporaryWorkflowService = InstanceAiTemporaryWorkflowService;
exports.InstanceAiTemporaryWorkflowService = InstanceAiTemporaryWorkflowService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, instance_ai_adapter_service_1.InstanceAiAdapterService, instance_ai_thread_repository_1.InstanceAiThreadRepository, db_1.UserRepository, db_1.AiBuilderTemporaryWorkflowRepository])
], InstanceAiTemporaryWorkflowService);
//# sourceMappingURL=instance-ai-temporary-workflow.service.js.map