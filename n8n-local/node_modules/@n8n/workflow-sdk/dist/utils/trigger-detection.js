"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTriggerNodeType = isTriggerNodeType;
const TRIGGER_NODE_TYPES = new Set([
    'n8n-nodes-base.webhook',
    'n8n-nodes-base.cron',
    'n8n-nodes-base.emailReadImap',
    'n8n-nodes-base.telegramBot',
    'n8n-nodes-base.start',
]);
function isTriggerNodeType(type) {
    if (TRIGGER_NODE_TYPES.has(type)) {
        return true;
    }
    return type.toLowerCase().includes('trigger');
}
//# sourceMappingURL=trigger-detection.js.map