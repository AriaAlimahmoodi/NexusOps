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
exports.ChatHubEventRelay = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const chat_hub_agent_service_1 = require("./chat-hub-agent.service");
let ChatHubEventRelay = class ChatHubEventRelay {
    constructor(logger, eventService, chatHubAgentService) {
        this.logger = logger;
        this.eventService = eventService;
        this.chatHubAgentService = chatHubAgentService;
        this.logger = this.logger.scoped('chat-hub');
        this.logger.debug('initializing ChatHub event relay...');
        this.eventService.on('user-deleted', async ({ targetUserId }) => {
            if (!targetUserId) {
                return;
            }
            await this.handleUserDeleted(targetUserId);
        });
    }
    async handleUserDeleted(userId) {
        try {
            await this.chatHubAgentService.deleteAllEmbeddingsForUser(userId);
        }
        catch (error) {
            this.logger.error('Failed to delete embeddings for deleted user', { userId, error });
        }
    }
};
exports.ChatHubEventRelay = ChatHubEventRelay;
exports.ChatHubEventRelay = ChatHubEventRelay = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.EventService, chat_hub_agent_service_1.ChatHubAgentService])
], ChatHubEventRelay);
//# sourceMappingURL=chat-hub-event-relay.service.js.map