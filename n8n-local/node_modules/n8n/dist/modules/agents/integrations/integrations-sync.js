"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAgentIntegrations = syncAgentIntegrations;
const di_1 = require("@n8n/di");
async function syncAgentIntegrations(agent, previous, next, logger) {
    try {
        const { ChatIntegrationService } = await import('./chat-integration.service.js');
        await di_1.Container.get(ChatIntegrationService).syncToConfig(agent, previous, next);
    }
    catch (error) {
        logger.warn('Failed to sync chat integrations', {
            agentId: agent.id,
            error,
        });
    }
}
//# sourceMappingURL=integrations-sync.js.map