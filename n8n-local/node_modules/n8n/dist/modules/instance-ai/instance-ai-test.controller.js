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
exports.InstanceAiTestController = void 0;
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const uuid_1 = require("uuid");
const errors_1 = require("@n8n/errors");
const instance_ai_memory_service_1 = require("./instance-ai-memory.service");
const instance_ai_service_1 = require("./instance-ai.service");
const instance_ai_thread_repository_1 = require("./repositories/instance-ai-thread.repository");
let InstanceAiTestController = class InstanceAiTestController {
    constructor(instanceAiService, threadRepo, workflowRepo, userRepo, memoryService, projectRepo) {
        this.instanceAiService = instanceAiService;
        this.threadRepo = threadRepo;
        this.workflowRepo = workflowRepo;
        this.userRepo = userRepo;
        this.memoryService = memoryService;
        this.projectRepo = projectRepo;
    }
    loadToolTrace(req) {
        this.assertTraceReplayEnabled();
        const { slug, events } = req.body;
        if (events) {
            this.instanceAiService.loadTraceEvents(slug, events);
        }
        this.instanceAiService.activateTraceSlug(slug);
        return { ok: true, count: events?.length ?? 0 };
    }
    getToolTrace(_req, _res, slug) {
        this.assertTraceReplayEnabled();
        return { events: this.instanceAiService.getTraceEvents(slug) };
    }
    getIdleState() {
        this.assertTraceReplayEnabled();
        return { idle: !this.instanceAiService.hasRunningWorkForTest() };
    }
    async startBackgroundTimeoutSimulation(payload) {
        this.assertTraceReplayEnabled();
        const threadId = payload.threadId ?? (0, uuid_1.v4)();
        const user = await this.userRepo.findOneByOrFail({ id: payload.userId });
        const personalProject = await this.projectRepo.getPersonalProjectForUserOrFail(user.id);
        await this.memoryService.ensureThread(user.id, threadId, personalProject.id, {
            source: 'playwright',
            origin: 'internal',
        });
        return await this.instanceAiService.startStuckBackgroundTaskForTest(user, threadId);
    }
    async runLivenessSweep(payload = {}) {
        this.assertTraceReplayEnabled();
        await this.instanceAiService.runLivenessSweepForTest(payload.now);
        return { ok: true };
    }
    clearToolTrace(_req, _res, slug) {
        this.assertTraceReplayEnabled();
        this.instanceAiService.clearTraceEvents(slug);
        return { ok: true };
    }
    async reset() {
        this.assertTraceReplayEnabled();
        this.instanceAiService.cancelAllBackgroundTasks();
        this.instanceAiService.clearTraceContextsForTest();
        const threads = await this.threadRepo.find({ select: ['id'] });
        for (const { id } of threads) {
            await this.instanceAiService.clearThreadState(id);
        }
        await this.threadRepo.createQueryBuilder().delete().execute();
        const workflowIds = await this.workflowRepo.find({ select: ['id'] });
        for (const { id } of workflowIds) {
            await this.workflowRepo.delete(id);
        }
        return {
            ok: true,
            threadsDeleted: threads.length,
            workflowsDeleted: workflowIds.length,
        };
    }
    assertTraceReplayEnabled() {
        if (process.env.E2E_TESTS !== 'true' || process.env.NODE_ENV === 'production') {
            throw new errors_1.ForbiddenError('Trace replay is not enabled');
        }
    }
};
exports.InstanceAiTestController = InstanceAiTestController;
__decorate([
    (0, decorators_1.Post)('/test/tool-trace', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InstanceAiTestController.prototype, "loadToolTrace", null);
__decorate([
    (0, decorators_1.Get)('/test/tool-trace/:slug', { skipAuth: true }),
    __param(2, (0, decorators_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], InstanceAiTestController.prototype, "getToolTrace", null);
__decorate([
    (0, decorators_1.Get)('/test/idle', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InstanceAiTestController.prototype, "getIdleState", null);
__decorate([
    (0, decorators_1.Post)('/test/background-timeout/start', { skipAuth: true }),
    __param(0, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiTestController.prototype, "startBackgroundTimeoutSimulation", null);
__decorate([
    (0, decorators_1.Post)('/test/liveness-sweep', { skipAuth: true }),
    __param(0, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InstanceAiTestController.prototype, "runLivenessSweep", null);
__decorate([
    (0, decorators_1.Delete)('/test/tool-trace/:slug', { skipAuth: true }),
    __param(2, (0, decorators_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], InstanceAiTestController.prototype, "clearToolTrace", null);
__decorate([
    (0, decorators_1.Post)('/test/reset', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstanceAiTestController.prototype, "reset", null);
exports.InstanceAiTestController = InstanceAiTestController = __decorate([
    (0, decorators_1.RestController)('/instance-ai'),
    __metadata("design:paramtypes", [instance_ai_service_1.InstanceAiService, instance_ai_thread_repository_1.InstanceAiThreadRepository, db_1.WorkflowRepository, db_1.UserRepository, instance_ai_memory_service_1.InstanceAiMemoryService, db_1.ProjectRepository])
], InstanceAiTestController);
//# sourceMappingURL=instance-ai-test.controller.js.map