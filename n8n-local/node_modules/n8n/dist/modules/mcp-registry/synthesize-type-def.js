"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizeNodeTypeDef = synthesizeNodeTypeDef;
const workflow_sdk_1 = require("@n8n/workflow-sdk");
function synthesizeNodeTypeDef(description) {
    const visibleDescription = {
        ...description,
        properties: description.properties.filter((property) => property.type !== 'hidden'),
    };
    if (!isSdkNodeTypeDescription(visibleDescription)) {
        throw new Error(`Cannot synthesize type definition for ${description.name}`);
    }
    return (0, workflow_sdk_1.generateNodeTypeFile)(visibleDescription);
}
function isSdkNodeTypeDescription(description) {
    return (Array.isArray(description.group) &&
        Array.isArray(description.properties) &&
        hasSdkConnections(description.inputs) &&
        hasSdkConnections(description.outputs) &&
        hasSdkCredentials(description.credentials));
}
function hasSdkConnections(connections) {
    if (typeof connections === 'string')
        return true;
    return (Array.isArray(connections) &&
        connections.every((connection) => typeof connection === 'string' ||
            (typeof connection.type === 'string' &&
                (connection.displayName === undefined || typeof connection.displayName === 'string'))));
}
function hasSdkCredentials(credentials) {
    return (credentials === undefined ||
        credentials.every((credential) => typeof credential.name === 'string' &&
            (credential.required === undefined || typeof credential.required === 'boolean')));
}
//# sourceMappingURL=synthesize-type-def.js.map