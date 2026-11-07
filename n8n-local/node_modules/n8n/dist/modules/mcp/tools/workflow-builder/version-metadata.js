"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionDescriptionInputSchema = exports.versionNameInputSchema = exports.MAX_VERSION_DESCRIPTION_LENGTH = exports.MAX_VERSION_NAME_LENGTH = void 0;
exports.buildCreateVersionMetadata = buildCreateVersionMetadata;
exports.buildUpdateVersionMetadata = buildUpdateVersionMetadata;
exports.buildRestoreVersionMetadata = buildRestoreVersionMetadata;
exports.resolveVersionMetadata = resolveVersionMetadata;
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
exports.MAX_VERSION_NAME_LENGTH = 80;
exports.MAX_VERSION_DESCRIPTION_LENGTH = 1000;
exports.versionNameInputSchema = zod_1.default.string().min(1).max(exports.MAX_VERSION_NAME_LENGTH).optional();
exports.versionDescriptionInputSchema = zod_1.default
    .string()
    .max(exports.MAX_VERSION_DESCRIPTION_LENGTH)
    .optional();
const MAX_LISTED_NODES = 5;
function truncate(text, maxLength) {
    return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}
function listNames(names) {
    if (names.length <= MAX_LISTED_NODES)
        return names.join(', ');
    const shown = names.slice(0, MAX_LISTED_NODES).join(', ');
    return `${shown} and ${names.length - MAX_LISTED_NODES} more`;
}
function countConnections(diff) {
    let count = 0;
    for (const inputs of Object.values(diff)) {
        for (const entries of Object.values(inputs)) {
            count += entries.length;
        }
    }
    return count;
}
function buildCreateVersionMetadata(nodes) {
    const nodeNames = nodes.map((node) => node.name);
    return {
        name: 'Initial version',
        description: truncate(`Created with ${nodes.length} node${nodes.length === 1 ? '' : 's'}: ${listNames(nodeNames)}`, exports.MAX_VERSION_DESCRIPTION_LENGTH),
    };
}
function buildUpdateVersionMetadata(previous, next) {
    const nodeDiff = (0, n8n_workflow_1.compareWorkflowsNodes)(previous.nodes, next.nodes);
    const nextNodesById = new Map(next.nodes.map((node) => [node.id, node]));
    const added = [];
    const removed = [];
    const modified = [];
    for (const { status, node } of nodeDiff.values()) {
        if (status === "added")
            added.push(node.name);
        else if (status === "deleted")
            removed.push(node.name);
        else if (status === "modified") {
            modified.push(nextNodesById.get(node.id)?.name ?? node.name);
        }
    }
    const connectionsDiff = (0, n8n_workflow_1.compareConnections)(previous.connections, next.connections);
    const connectionsAdded = countConnections(connectionsDiff.added);
    const connectionsRemoved = countConnections(connectionsDiff.removed);
    const nameParts = [];
    if (added.length)
        nameParts.push(`added ${listNames(added)}`);
    if (removed.length)
        nameParts.push(`removed ${listNames(removed)}`);
    if (modified.length)
        nameParts.push(`updated ${listNames(modified)}`);
    if (!nameParts.length && (connectionsAdded || connectionsRemoved)) {
        nameParts.push('rewired connections');
    }
    const descriptionParts = [];
    if (added.length)
        descriptionParts.push(`Added nodes: ${listNames(added)}`);
    if (removed.length)
        descriptionParts.push(`Removed nodes: ${listNames(removed)}`);
    if (modified.length)
        descriptionParts.push(`Updated nodes: ${listNames(modified)}`);
    if (connectionsAdded || connectionsRemoved) {
        descriptionParts.push(`Connections: ${connectionsAdded} added, ${connectionsRemoved} removed`);
    }
    if (!nameParts.length)
        nameParts.push('updated workflow');
    if (!descriptionParts.length)
        descriptionParts.push('Updated workflow');
    const name = nameParts.join('; ');
    return {
        name: truncate(name.charAt(0).toUpperCase() + name.slice(1), exports.MAX_VERSION_NAME_LENGTH),
        description: truncate(descriptionParts.join('\n'), exports.MAX_VERSION_DESCRIPTION_LENGTH),
    };
}
function buildRestoreVersionMetadata(restoredFrom) {
    const label = restoredFrom.name
        ? `"${restoredFrom.name}"`
        : `version ${restoredFrom.versionId.slice(0, 8)}`;
    return {
        name: truncate(`Restored ${label}`, exports.MAX_VERSION_NAME_LENGTH),
        description: truncate(`Restored to version ${restoredFrom.versionId} (created ${restoredFrom.createdAt.toISOString()})`, exports.MAX_VERSION_DESCRIPTION_LENGTH),
    };
}
function resolveVersionMetadata(provided, fallback) {
    return {
        name: provided.versionName?.trim() || fallback.name,
        description: provided.versionDescription?.trim() || fallback.description,
    };
}
//# sourceMappingURL=version-metadata.js.map