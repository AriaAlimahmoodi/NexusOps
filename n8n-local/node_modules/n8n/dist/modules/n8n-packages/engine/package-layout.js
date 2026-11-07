"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldersInScope = foldersInScope;
exports.workflowsInScope = workflowsInScope;
exports.needsBundledCredentialData = needsBundledCredentialData;
exports.placeCredentialData = placeCredentialData;
exports.needsBundledVariableValues = needsBundledVariableValues;
exports.needsBundledCredentialFiles = needsBundledCredentialFiles;
exports.placeByPolicy = placeByPolicy;
exports.placeByLayout = placeByLayout;
exports.deriveParentFolderId = deriveParentFolderId;
const n8n_workflow_1 = require("n8n-workflow");
const credential_conflict_policy_1 = require("../entities/credential/credential-conflict-policy");
const credential_missing_mode_1 = require("../entities/credential/credential-missing-mode");
const variable_missing_mode_1 = require("../entities/variable/variable-missing-mode");
const n8n_packages_types_1 = require("../n8n-packages.types");
function foldersInScope(entries, basePrefix = '') {
    return (entries ?? []).filter((entry) => entry.target.startsWith(`${basePrefix}folders/`));
}
function workflowsInScope(entries, basePrefix = '') {
    return (entries ?? []).filter((entry) => entry.target.startsWith(`${basePrefix}workflows/`) ||
        entry.target.startsWith(`${basePrefix}folders/`));
}
function needsBundledCredentialData(request, hasRequirements) {
    return hasRequirements && (0, credential_missing_mode_1.credentialMissingModeUsesPackageData)(request.credentialMissingMode);
}
function placeCredentialData({ requirements, bundledCredentials, }) {
    return requirements?.map((requirement) => {
        const credential = bundledCredentials?.get(requirement.id);
        const packageData = credential?.data;
        return {
            ...requirement,
            ...(packageData !== undefined ? { packageData } : {}),
            ...(credential?.dataIsComplete !== undefined
                ? { packageDataIsComplete: credential.dataIsComplete }
                : {}),
        };
    });
}
function needsBundledVariableValues(request, hasRequirements) {
    return (hasRequirements &&
        ((0, variable_missing_mode_1.variableMissingModeUsesPackageValue)(request.variableMissingMode) ||
            request.variableConflictPolicy !== n8n_packages_types_1.VariableConflictPolicy.KeepExisting));
}
function needsBundledCredentialFiles(request, hasRequirements) {
    return (hasRequirements &&
        (0, credential_conflict_policy_1.resolveCredentialConflictPolicy)(request.credentialConflictPolicy) !==
            n8n_packages_types_1.CredentialConflictPolicy.KeepExisting);
}
function variableBundleEntry(entries, basePrefix, name) {
    const named = (entries ?? []).filter((entry) => entry.name === name);
    const scoped = named.filter((entry) => entry.target.startsWith(`${basePrefix}variables/`));
    const topLevel = named.filter((entry) => entry.target.startsWith('variables/'));
    const winning = scoped.length > 0 ? scoped : topLevel;
    if (winning.length > 1) {
        throw new n8n_workflow_1.UserError(`Package contains ambiguous variable entries for "${name}".`);
    }
    return winning[0];
}
function placeWith({ requirements, manifestVariables, bundledVariables }, basePrefix, isGlobal) {
    return requirements?.map((requirement) => {
        const bundle = variableBundleEntry(manifestVariables, basePrefix, requirement.name);
        const packageValue = bundle ? bundledVariables?.get(bundle.target)?.value : undefined;
        return {
            ...requirement,
            globalPlacement: isGlobal(bundle),
            ...(packageValue !== undefined ? { packageValue } : {}),
        };
    });
}
function placeByPolicy(params) {
    const global = params.policy === n8n_packages_types_1.VariableParentPolicy.Global;
    return placeWith(params, '', () => global);
}
function placeByLayout(params) {
    return placeWith(params, params.scopePrefix, (bundle) => bundle !== undefined && !bundle.target.startsWith(params.scopePrefix));
}
function deriveParentFolderId(workflowTarget, folderTargetToId) {
    const idx = workflowTarget.lastIndexOf('/workflows/');
    if (idx === -1)
        return null;
    const containerTarget = workflowTarget.slice(0, idx);
    if (!containerTarget.includes('folders/'))
        return null;
    const folderId = folderTargetToId.get(containerTarget);
    if (folderId === undefined) {
        throw new n8n_workflow_1.UserError(`Package workflow at "${workflowTarget}" is nested under folder "${containerTarget}", which is missing from the manifest.`);
    }
    return folderId;
}
//# sourceMappingURL=package-layout.js.map