"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProviderModelId = normalizeProviderModelId;
exports.findVerifiedModelId = findVerifiedModelId;
const model_snapshot_alias_1 = require("./model-snapshot-alias");
const GOOGLE_MODEL_ID_PREFIX = 'models/';
function normalizeProviderModelId(provider, id) {
    if (provider === 'google' && id.startsWith(GOOGLE_MODEL_ID_PREFIX)) {
        return id.slice(GOOGLE_MODEL_ID_PREFIX.length);
    }
    return id;
}
function findVerifiedModelId(provider, wantedModel, verifiedModelIds) {
    const wanted = normalizeProviderModelId(provider, wantedModel.trim()).toLowerCase();
    if (!wanted)
        return undefined;
    const normalized = verifiedModelIds.map((id) => normalizeProviderModelId(provider, id));
    return (normalized.find((id) => id.toLowerCase() === wanted) ??
        normalized.find((id) => (0, model_snapshot_alias_1.stripSnapshotSuffix)(id).toLowerCase() === wanted));
}
//# sourceMappingURL=provider-model-id.js.map