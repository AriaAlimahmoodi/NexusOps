"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasHttpHeaderAuthDecryptedData = hasHttpHeaderAuthDecryptedData;
exports.hasJwtSecretDecryptedData = hasJwtSecretDecryptedData;
exports.hasJwtPemKeyDecryptedData = hasJwtPemKeyDecryptedData;
exports.isJSONRPCRequest = isJSONRPCRequest;
const is_record_1 = require("@n8n/utils/is-record");
function hasHttpHeaderAuthDecryptedData(value) {
    if (!(0, is_record_1.isRecord)(value))
        return false;
    const obj = value;
    const dataCandidate = obj['data'];
    if (!(0, is_record_1.isRecord)(dataCandidate))
        return false;
    const data = dataCandidate;
    return typeof data.name === 'string';
}
function hasJwtSecretDecryptedData(value) {
    if (!(0, is_record_1.isRecord)(value))
        return false;
    const obj = value;
    const dataCandidate = obj['data'];
    if (!(0, is_record_1.isRecord)(dataCandidate))
        return false;
    const data = dataCandidate;
    return typeof data.secret === 'string';
}
function hasJwtPemKeyDecryptedData(value) {
    if (!(0, is_record_1.isRecord)(value))
        return false;
    const obj = value;
    const dataCandidate = obj['data'];
    if (!(0, is_record_1.isRecord)(dataCandidate))
        return false;
    const data = dataCandidate;
    if (typeof data.keyType === 'string' && data.keyType === 'pemKey')
        return true;
    return typeof data.privateKey === 'string' || typeof data.publicKey === 'string';
}
function isJSONRPCRequest(value) {
    if (!(0, is_record_1.isRecord)(value))
        return false;
    if ('jsonrpc' in value && typeof value.jsonrpc !== 'string')
        return false;
    if ('method' in value && typeof value.method !== 'string')
        return false;
    if ('params' in value && value.params !== undefined && !(0, is_record_1.isRecord)(value.params))
        return false;
    if ('id' in value &&
        value.id !== null &&
        typeof value.id !== 'string' &&
        typeof value.id !== 'number')
        return false;
    return true;
}
//# sourceMappingURL=mcp.typeguards.js.map