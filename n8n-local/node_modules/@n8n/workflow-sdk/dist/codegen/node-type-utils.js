"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTriggerType = isTriggerType;
exports.isStickyNote = isStickyNote;
exports.isMergeType = isMergeType;
exports.generateDefaultNodeName = generateDefaultNodeName;
const node_types_1 = require("../constants/node-types");
function isTriggerType(type) {
    return type.toLowerCase().includes('trigger') || (0, node_types_1.isWebhookType)(type);
}
function isStickyNote(type) {
    return (0, node_types_1.isStickyNoteType)(type);
}
function isMergeType(type) {
    return (0, node_types_1.isMergeNodeType)(type);
}
function generateDefaultNodeName(type) {
    const parts = type.split('.');
    const nodeName = parts[parts.length - 1];
    return nodeName
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/Http/g, 'HTTP')
        .replace(/Api/g, 'API')
        .replace(/Url/g, 'URL')
        .replace(/Id/g, 'ID')
        .replace(/Json/g, 'JSON')
        .replace(/Xml/g, 'XML')
        .replace(/Sql/g, 'SQL')
        .replace(/Ai/g, 'AI')
        .replace(/Aws/g, 'AWS')
        .replace(/Gcp/g, 'GCP')
        .replace(/Ssh/g, 'SSH')
        .replace(/Ftp/g, 'FTP')
        .replace(/Csv/g, 'CSV');
}
//# sourceMappingURL=node-type-utils.js.map