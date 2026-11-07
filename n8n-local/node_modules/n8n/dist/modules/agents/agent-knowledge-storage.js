"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentKnowledgePaths = getAgentKnowledgePaths;
exports.hasControlCharacter = hasControlCharacter;
exports.assertKnowledgePathSegment = assertKnowledgePathSegment;
exports.storageFileNameForOriginalFileName = storageFileNameForOriginalFileName;
exports.toAgentFileDto = toAgentFileDto;
const sandbox_1 = require("@n8n/agents/sandbox");
const node_path_1 = __importDefault(require("node:path"));
const errors_1 = require("@n8n/errors");
function getAgentKnowledgePaths(provider) {
    const home = node_path_1.default.dirname((0, sandbox_1.getPromptWorkspaceRoot)(provider));
    const mirrorDir = `${home}/knowledge-mirror`;
    return {
        filesDir: `${mirrorDir}/files`,
        manifest: `${mirrorDir}/manifest`,
        stagingDir: `${mirrorDir}/.staging`,
    };
}
function hasControlCharacter(value) {
    for (const character of value) {
        if (character.charCodeAt(0) < 32) {
            return true;
        }
    }
    return false;
}
function sanitizePathCharacter(character) {
    if (character === '/' || character === '\\' || character.charCodeAt(0) < 32) {
        return '_';
    }
    return character;
}
function assertKnowledgePathSegment(segment, label) {
    if (!segment ||
        segment === '.' ||
        segment === '..' ||
        /[\\/]/.test(segment) ||
        hasControlCharacter(segment)) {
        throw new Error(`Invalid ${label} for agent knowledge storage`);
    }
}
function sanitizeStorageFileName(originalName) {
    const basename = node_path_1.default.basename(originalName);
    const sanitized = Array.from(basename, sanitizePathCharacter).join('');
    if (!sanitized || sanitized === '.' || sanitized === '..') {
        throw new errors_1.BadRequestError(`Invalid knowledge file name "${originalName}"`);
    }
    return sanitized;
}
function storageFileNameForOriginalFileName(originalFileName) {
    const sanitizedName = sanitizeStorageFileName(originalFileName);
    const extension = node_path_1.default.extname(sanitizedName).toLowerCase();
    if (extension === '.pdf') {
        const baseName = node_path_1.default.basename(sanitizedName, node_path_1.default.extname(sanitizedName));
        return `${baseName}.txt`;
    }
    return sanitizedName;
}
function toAgentFileDto(file) {
    return {
        id: file.id,
        agentId: file.agentId,
        fileName: file.fileName,
        mimeType: file.mimeType,
        fileSizeBytes: file.fileSizeBytes,
        createdAt: file.createdAt.toISOString(),
    };
}
//# sourceMappingURL=agent-knowledge-storage.js.map