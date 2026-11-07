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
exports.AgentDependencyIndexListener = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const agent_dependency_index_service_1 = require("./agent-dependency-index.service");
let AgentDependencyIndexListener = class AgentDependencyIndexListener {
    constructor(logger, eventService, indexService) {
        this.logger = logger;
        this.eventService = eventService;
        this.indexService = indexService;
        this.logger = this.logger.scoped('agents');
    }
    init() {
        this.eventService.on('server-started', async () => {
            await this.run('build dependency index', async () => {
                await this.indexService.buildIndex();
            });
        });
        this.eventService.on('agent-saved', async ({ agentId }) => {
            await this.run('refresh dependency index', async () => {
                await this.indexService.refresh(agentId);
            });
        });
        this.eventService.on('agent-deleted', async ({ agentId }) => {
            await this.run('remove dependency index entries', async () => {
                await this.indexService.remove(agentId);
            });
        });
        this.eventService.on('credentials-updated', async ({ credentialId }) => {
            await this.run('invalidate dependent agent runtimes', async () => {
                await this.indexService.invalidateRuntimesForCredential(credentialId);
            });
        });
        this.subscribeToWorkflowEvents();
    }
    subscribeToWorkflowEvents() {
        const invalidate = async ({ workflowId }) => {
            await this.run('invalidate dependent agent runtimes', async () => {
                await this.indexService.invalidateRuntimesForWorkflow(workflowId);
            });
        };
        this.eventService.on('workflow-saved', async ({ workflow }) => {
            await invalidate({ workflowId: workflow.id });
        });
        this.eventService.on('workflow-activated', invalidate);
        this.eventService.on('workflow-deactivated', invalidate);
        this.eventService.on('workflow-archived', invalidate);
        this.eventService.on('workflow-unarchived', invalidate);
    }
    async run(action, operation) {
        try {
            await operation();
        }
        catch (error) {
            this.logger.error(`Failed to ${action}`, { error });
        }
    }
};
exports.AgentDependencyIndexListener = AgentDependencyIndexListener;
exports.AgentDependencyIndexListener = AgentDependencyIndexListener = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.EventService, agent_dependency_index_service_1.AgentDependencyIndexService])
], AgentDependencyIndexListener);
//# sourceMappingURL=agent-dependency-index.listener.js.map