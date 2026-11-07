"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCredentialConflictPolicy = resolveCredentialConflictPolicy;
exports.credentialUpdateScope = credentialUpdateScope;
exports.isUpdateCandidate = isUpdateCandidate;
exports.credentialDiffers = credentialDiffers;
exports.differingCredentials = differingCredentials;
exports.divergentCredentials = divergentCredentials;
exports.credentialConflicts = credentialConflicts;
exports.forbiddenCredentialUpdates = forbiddenCredentialUpdates;
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const credential_data_merge_1 = require("../../../../credentials/credential-data-merge");
const n8n_packages_types_1 = require("../../n8n-packages.types");
const requirement_consumers_1 = require("../../spec/requirement-consumers");
function resolveCredentialConflictPolicy(policy) {
    return policy ?? n8n_packages_types_1.CredentialConflictPolicy.KeepExisting;
}
function credentialUpdateScope(destinationProjectIds) {
    return { projectIds: new Set(destinationProjectIds) };
}
function isUpdateCandidate(credential, scope) {
    if (credential.isManaged || credential.isResolvable || credential.usageScope === 'instance') {
        return false;
    }
    const ownerProjectId = credential.shared?.find((sharing) => sharing.role === 'credential:owner')?.projectId;
    return ownerProjectId !== undefined && scope.projectIds.has(ownerProjectId);
}
function mergeIntoStored(stored, incoming) {
    return (0, credential_data_merge_1.mergeCredentialData)({ existing: stored, incoming, arrays: 'keep-existing' });
}
function credentialDiffers(stored, incoming) {
    if (stored.name !== incoming.name)
        return true;
    if (incoming.data === undefined)
        return false;
    return !(0, isEqual_1.default)(mergeIntoStored(stored.data, incoming.data), stored.data);
}
function writtenPayload(candidate) {
    return { name: candidate.name, data: mergeIntoStored({}, candidate.data ?? {}) };
}
function uniqueSorted(values) {
    return [...new Set(values)].sort();
}
function groupByTarget(candidates) {
    const byTarget = new Map();
    for (const candidate of candidates) {
        const group = byTarget.get(candidate.targetId) ?? [];
        const index = group.findIndex(({ sourceId }) => sourceId === candidate.sourceId);
        if (index === -1) {
            group.push(candidate);
        }
        else {
            group[index] = {
                ...group[index],
                usedBy: (0, requirement_consumers_1.mergeRequirementConsumers)([...group[index].usedBy, ...candidate.usedBy]),
            };
        }
        byTarget.set(candidate.targetId, group);
    }
    return byTarget;
}
function toTargetIssue(targetId, group) {
    return {
        targetId,
        sourceIds: uniqueSorted(group.map(({ sourceId }) => sourceId)),
        name: group[0].targetName,
        usedBy: (0, requirement_consumers_1.mergeRequirementConsumers)(group.flatMap(({ usedBy }) => usedBy)),
    };
}
function toConflict(kind, targetId, group) {
    return { kind, ...toTargetIssue(targetId, group) };
}
function differingCredentials(updates) {
    return [...groupByTarget(updates)].map(([targetId, group]) => toConflict('differs', targetId, group));
}
function divergentCredentials(candidates) {
    return [...groupByTarget(candidates)]
        .filter(([, group]) => {
        const [first, ...others] = group.map(writtenPayload);
        return others.some((payload) => !(0, isEqual_1.default)(payload, first));
    })
        .map(([targetId, group]) => toConflict('divergent', targetId, group));
}
const CONFLICTS = {
    'keep-existing': () => [],
    overwrite: (candidates) => divergentCredentials(candidates),
    fail: (_candidates, updates) => differingCredentials(updates),
};
function credentialConflicts(policy, plans) {
    return CONFLICTS[policy](plans.flatMap(({ candidates }) => candidates), plans.flatMap(({ updates }) => updates));
}
function forbiddenCredentialUpdates(plans) {
    return [...groupByTarget(plans.flatMap(({ forbidden }) => forbidden))].map(([targetId, group]) => toTargetIssue(targetId, group));
}
//# sourceMappingURL=credential-conflict-policy.js.map