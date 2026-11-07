"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSubgraphPhase = isSubgraphPhase;
exports.createDiscoveryMetadata = createDiscoveryMetadata;
exports.createBuilderMetadata = createBuilderMetadata;
exports.createErrorMetadata = createErrorMetadata;
exports.createStateManagementMetadata = createStateManagementMetadata;
exports.createAssistantMetadata = createAssistantMetadata;
exports.createResponderMetadata = createResponderMetadata;
const SUBGRAPH_PHASES = [
    'discovery',
    'builder',
    'assistant',
    'state_management',
    'responder',
];
function isSubgraphPhase(value) {
    return SUBGRAPH_PHASES.includes(value);
}
function createDiscoveryMetadata(data) {
    return { phase: 'discovery', ...data };
}
function createBuilderMetadata(data) {
    return { phase: 'builder', ...data };
}
function createErrorMetadata(data) {
    return { phase: 'error', ...data };
}
function createStateManagementMetadata(data) {
    return { phase: 'state_management', ...data };
}
function createAssistantMetadata(data) {
    return { phase: 'assistant', ...data };
}
function createResponderMetadata(data) {
    return { phase: 'responder', ...data };
}
//# sourceMappingURL=coordination.js.map