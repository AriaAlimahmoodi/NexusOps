"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExternalSecretExpressionPaths = getExternalSecretExpressionPaths;
exports.extractProviderKeysFromExpression = extractProviderKeysFromExpression;
exports.extractProviderKeysFromCredentialData = extractProviderKeysFromCredentialData;
const api_types_1 = require("@n8n/api-types");
const get_1 = __importDefault(require("lodash/get"));
const utils_1 = require("../utils");
const SECRETS_REFERENCE_REGEX = /\$secrets\b/;
function containsExternalSecretExpression(value) {
    for (const [, blockContent] of value.matchAll(/\{\{(.*?)\}\}/gs)) {
        if (SECRETS_REFERENCE_REGEX.test(blockContent)) {
            return true;
        }
    }
    return false;
}
function getExternalSecretExpressionPaths(data) {
    return (0, utils_1.getAllKeyPaths)(data, '', [], containsExternalSecretExpression);
}
function extractProviderKeysFromExpression(expression) {
    const providerKeys = new Set();
    const expressionBlocks = expression.matchAll(/\{\{(.*?)\}\}/gs);
    for (const expression of expressionBlocks) {
        const expressionContent = expression[1];
        const dotMatches = expressionContent.matchAll(new RegExp(`\\$secrets\\s*\\.\\s*(${api_types_1.SECRETS_PROVIDER_KEY_PATTERN})(?=\\s*\\.|\\s*\\[)`, 'g'));
        for (const match of dotMatches) {
            providerKeys.add(match[1]);
        }
        const bracketMatches = expressionContent.matchAll(new RegExp(`\\$secrets\\s*\\[\\s*['"](${api_types_1.SECRETS_PROVIDER_KEY_PATTERN})['"]\\s*\\]`, 'g'));
        for (const match of bracketMatches) {
            providerKeys.add(match[1]);
        }
    }
    return Array.from(providerKeys);
}
function extractProviderKeysFromCredentialData(data) {
    const secretPaths = getExternalSecretExpressionPaths(data);
    const providerKeys = new Set();
    for (const path of secretPaths) {
        const expressionString = (0, get_1.default)(data, path);
        if (typeof expressionString !== 'string')
            continue;
        for (const providerKey of extractProviderKeysFromExpression(expressionString)) {
            providerKeys.add(providerKey);
        }
    }
    return providerKeys;
}
//# sourceMappingURL=external-secrets.utils.js.map