"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentConfigHash = getAgentConfigHash;
exports.isSameAgentConfig = isSameAgentConfig;
exports.getAgentSkillHash = getAgentSkillHash;
const is_record_1 = require("@n8n/utils/is-record");
const node_crypto_1 = require("node:crypto");
function canonicalizeJson(value) {
    if (Array.isArray(value))
        return value.map((item) => canonicalizeJson(item));
    if (!(0, is_record_1.isRecord)(value))
        return value;
    const sorted = {};
    for (const key of Object.keys(value).sort())
        sorted[key] = canonicalizeJson(value[key]);
    return sorted;
}
function getHash(value) {
    return (0, node_crypto_1.createHash)('sha256')
        .update(JSON.stringify(canonicalizeJson(value)))
        .digest('hex');
}
function getAgentConfigHash(config) {
    if (!config)
        return null;
    return getHash(config);
}
function isSameAgentConfig(a, b) {
    return getHash(a) === getHash(b);
}
function getAgentSkillHash(skill) {
    return getHash(skill);
}
//# sourceMappingURL=agent-config-hash.js.map