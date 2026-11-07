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
exports.AgentChannelMediaRetentionTask = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const agent_chat_attachment_service_1 = require("./agent-chat-attachment.service");
const agent_repository_1 = require("./repositories/agent.repository");
let AgentChannelMediaRetentionTask = class AgentChannelMediaRetentionTask {
    constructor(agentRepository, attachmentService, logger) {
        this.agentRepository = agentRepository;
        this.attachmentService = attachmentService;
        this.logger = logger;
        this.name = 'agent-channel-media-retention';
        this.schedule = (0, decorators_1.intervalFromSeconds)(constants_1.Time.hours.toSeconds);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: { retryOnFailure: true },
            leaderTimer: { runOnTakeover: true, retryDelaySeconds: 60 },
        });
    }
    async run(signal) {
        const agents = await this.agentRepository.findWithIntegrationType('whatsapp');
        for (const agent of agents) {
            if (signal.aborted)
                return;
            const integration = agent.integrations?.find((i) => i.type === 'whatsapp');
            if (integration?.type !== 'whatsapp')
                continue;
            const { mediaRetentionDays } = (0, api_types_1.resolveWhatsAppSettings)(integration.settings);
            const before = new Date(Date.now() - mediaRetentionDays * constants_1.Time.days.toMilliseconds);
            try {
                const deleted = await this.attachmentService.deleteFromSourceCreatedBefore({ agentId: agent.id, source: 'whatsapp' }, before, signal);
                if (deleted > 0) {
                    this.logger.debug('[AgentChannelMediaRetention] Deleted expired WhatsApp media', {
                        agentId: agent.id,
                        deleted,
                    });
                }
            }
            catch (error) {
                this.logger.warn('[AgentChannelMediaRetention] Failed to delete expired WhatsApp media', {
                    agentId: agent.id,
                    error,
                });
            }
        }
    }
};
exports.AgentChannelMediaRetentionTask = AgentChannelMediaRetentionTask;
exports.AgentChannelMediaRetentionTask = AgentChannelMediaRetentionTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [agent_repository_1.AgentRepository, agent_chat_attachment_service_1.AgentChatAttachmentService, backend_common_1.Logger])
], AgentChannelMediaRetentionTask);
//# sourceMappingURL=agent-channel-media-retention.task.js.map