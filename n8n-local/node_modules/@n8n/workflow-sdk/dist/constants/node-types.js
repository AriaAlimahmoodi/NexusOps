"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_TYPES = void 0;
exports.isIfNodeType = isIfNodeType;
exports.isSwitchNodeType = isSwitchNodeType;
exports.isMergeNodeType = isMergeNodeType;
exports.isStickyNoteType = isStickyNoteType;
exports.isSplitInBatchesType = isSplitInBatchesType;
exports.isHttpRequestType = isHttpRequestType;
exports.isWebhookType = isWebhookType;
exports.isDataTableType = isDataTableType;
exports.NODE_TYPES = {
    IF: 'n8n-nodes-base.if',
    SWITCH: 'n8n-nodes-base.switch',
    MERGE: 'n8n-nodes-base.merge',
    STICKY_NOTE: 'n8n-nodes-base.stickyNote',
    SPLIT_IN_BATCHES: 'n8n-nodes-base.splitInBatches',
    HTTP_REQUEST: 'n8n-nodes-base.httpRequest',
    WEBHOOK: 'n8n-nodes-base.webhook',
    DATA_TABLE: 'n8n-nodes-base.dataTable',
};
function isIfNodeType(type) {
    return type === exports.NODE_TYPES.IF;
}
function isSwitchNodeType(type) {
    return type === exports.NODE_TYPES.SWITCH;
}
function isMergeNodeType(type) {
    return type === exports.NODE_TYPES.MERGE;
}
function isStickyNoteType(type) {
    return type === exports.NODE_TYPES.STICKY_NOTE;
}
function isSplitInBatchesType(type) {
    return type === exports.NODE_TYPES.SPLIT_IN_BATCHES;
}
function isHttpRequestType(type) {
    return type === exports.NODE_TYPES.HTTP_REQUEST;
}
function isWebhookType(type) {
    return type === exports.NODE_TYPES.WEBHOOK;
}
function isDataTableType(type) {
    return type === exports.NODE_TYPES.DATA_TABLE;
}
//# sourceMappingURL=node-types.js.map