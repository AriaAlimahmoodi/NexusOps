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
exports.SubAgentCleanupService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const agent_runtime_cache_service_1 = require("../agent-runtime-cache.service");
const agent_repository_1 = require("../repositories/agent.repository");
const agent_draft_utils_1 = require("../utils/agent-draft.utils");
let SubAgentCleanupService = class SubAgentCleanupService {
    constructor(logger, agentRepository, runtimeCacheService) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.runtimeCacheService = runtimeCacheService;
    }
    async removeSubAgentFromParents(childAgentId, projectId) {
        const agents = await this.agentRepository.find({ where: { projectId } });
        for (const parent of agents) {
            if (parent.id === childAgentId)
                continue;
            await this.removeSubAgentFromParent(parent, childAgentId);
        }
    }
    async removeSubAgentFromParent(initial, childAgentId) {
        let parent = initial;
        for (let attempt = 0; attempt < 3 && parent; attempt++) {
            const { schema } = parent;
            const configuredAgents = schema?.subAgents?.agents;
            if (!schema || !configuredAgents?.some((ref) => ref.agentId === childAgentId))
                return;
            parent.schema = {
                ...schema,
                subAgents: {
                    ...schema.subAgents,
                    agents: configuredAgents.filter((ref) => ref.agentId !== childAgentId),
                },
            };
            (0, agent_draft_utils_1.markAgentDraftDirty)(parent);
            if (await this.agentRepository.saveDraftFenced(parent)) {
                this.runtimeCacheService.clearRuntimes(parent.id);
                this.logger.debug('Removed sub-agent reference from parent agent', {
                    childAgentId,
                    parentId: parent.id,
                });
                return;
            }
            parent = await this.agentRepository.findById(parent.id);
        }
        this.logger.warn('Could not remove sub-agent reference from parent agent', {
            childAgentId,
            parentId: initial.id,
        });
    }
};
exports.SubAgentCleanupService = SubAgentCleanupService;
exports.SubAgentCleanupService = SubAgentCleanupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, agent_runtime_cache_service_1.AgentRuntimeCacheService])
], SubAgentCleanupService);
//# sourceMappingURL=sub-agent-cleanup.service.js.map