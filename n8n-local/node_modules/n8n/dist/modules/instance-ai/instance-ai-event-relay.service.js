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
exports.InstanceAiEventRelay = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const instance_ai_memory_service_1 = require("./instance-ai-memory.service");
const instance_ai_mcp_registry_connection_repository_1 = require("./repositories/instance-ai-mcp-registry-connection.repository");
let InstanceAiEventRelay = class InstanceAiEventRelay {
    constructor(logger, eventService, memoryService, mcpRegistryConnectionRepository) {
        this.logger = logger;
        this.eventService = eventService;
        this.memoryService = memoryService;
        this.mcpRegistryConnectionRepository = mcpRegistryConnectionRepository;
        this.logger = this.logger.scoped('instance-ai');
        this.logger.debug('initializing Instance AI event relay...');
        this.eventService.on('user-deleted', async ({ targetUserId }) => {
            if (!targetUserId) {
                return;
            }
            await this.handleUserDeleted(targetUserId);
        });
    }
    async handleUserDeleted(userId) {
        try {
            const deletedThreads = await this.memoryService.deleteThreadsForUser(userId);
            const { affected } = await this.mcpRegistryConnectionRepository.delete({ userId });
            this.logger.debug('Cleaned up Instance AI data for deleted user', {
                userId,
                deletedThreads,
                deletedMcpConnections: affected ?? 0,
            });
        }
        catch (error) {
            this.logger.error('Failed to clean up Instance AI data for deleted user', { userId, error });
        }
    }
};
exports.InstanceAiEventRelay = InstanceAiEventRelay;
exports.InstanceAiEventRelay = InstanceAiEventRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.EventService, instance_ai_memory_service_1.InstanceAiMemoryService, instance_ai_mcp_registry_connection_repository_1.InstanceAiMcpRegistryConnectionRepository])
], InstanceAiEventRelay);
//# sourceMappingURL=instance-ai-event-relay.service.js.map