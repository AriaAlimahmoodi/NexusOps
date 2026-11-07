"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertPackageImportApiKeyScopes = assertPackageImportApiKeyScopes;
exports.assertVariableWritesAllowed = assertVariableWritesAllowed;
exports.assertDataTableWritesAllowed = assertDataTableWritesAllowed;
exports.assertCredentialWritesAllowed = assertCredentialWritesAllowed;
exports.assertTagWritesAllowed = assertTagWritesAllowed;
exports.assertArchiveTransitionsAllowed = assertArchiveTransitionsAllowed;
const errors_1 = require("@n8n/errors");
const credential_missing_mode_1 = require("../entities/credential/credential-missing-mode");
function assertPackageImportApiKeyScopes(apiKeyScopes, required) {
    if (apiKeyScopes === undefined)
        return;
    for (const scope of required) {
        if (!apiKeyScopes.includes(scope)) {
            throw new errors_1.ForbiddenError('Forbidden');
        }
    }
}
function assertVariableWritesAllowed(options) {
    const { licenseState, apiKeyScopes, hasCreations, hasOverwrites } = options;
    if (!hasCreations && !hasOverwrites)
        return;
    if (!licenseState.isVariablesLicensed()) {
        throw new errors_1.ForbiddenError('Your license does not allow variables. Importing a package that writes variables requires a license that supports variables.');
    }
    if (hasCreations)
        assertPackageImportApiKeyScopes(apiKeyScopes, ['variable:create']);
    if (hasOverwrites)
        assertPackageImportApiKeyScopes(apiKeyScopes, ['variable:update']);
}
function assertDataTableWritesAllowed(apiKeyScopes, dataTablePlans) {
    if (dataTablePlans.some((plan) => plan.creations.length > 0)) {
        assertPackageImportApiKeyScopes(apiKeyScopes, ['dataTable:create']);
    }
    if (dataTablePlans.some((plan) => plan.updates.length + plan.columnAlignments.length > 0)) {
        assertPackageImportApiKeyScopes(apiKeyScopes, ['dataTable:update']);
    }
}
function assertCredentialWritesAllowed(apiKeyScopes, credentialPlans) {
    const createsCredential = credentialPlans.some(({ missingMode, resolution }) => (0, credential_missing_mode_1.credentialMissingModeUsesPackageData)(missingMode) &&
        (0, credential_missing_mode_1.credentialsToStub)(missingMode, resolution).length > 0);
    if (createsCredential)
        assertPackageImportApiKeyScopes(apiKeyScopes, ['credential:create']);
}
function assertTagWritesAllowed(apiKeyScopes, tagPlans) {
    if (tagPlans.some((plan) => plan.creations.length > 0)) {
        assertPackageImportApiKeyScopes(apiKeyScopes, ['tag:create']);
    }
    if (tagPlans.some((plan) => plan.renames.length > 0 || plan.reconciles.length > 0)) {
        assertPackageImportApiKeyScopes(apiKeyScopes, ['tag:update']);
    }
}
function assertArchiveTransitionsAllowed(apiKeyScopes, workflowPlans) {
    const hasTransitions = workflowPlans.some((plan) => plan.items.some((item) => item.action === 'update' && item.archiveTransition !== null));
    if (hasTransitions) {
        assertPackageImportApiKeyScopes(apiKeyScopes, ['workflow:delete']);
    }
}
//# sourceMappingURL=import-gates.js.map