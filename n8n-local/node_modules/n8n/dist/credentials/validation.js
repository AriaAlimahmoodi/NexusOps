"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChangingExternalSecretExpression = isChangingExternalSecretExpression;
exports.validateExternalSecretsPermissions = validateExternalSecretsPermissions;
exports.validateAccessToReferencedSecretProviders = validateAccessToReferencedSecretProviders;
exports.parseCredentialDescription = parseCredentialDescription;
const api_types_1 = require("@n8n/api-types");
const get_1 = __importDefault(require("lodash/get"));
const errors_1 = require("@n8n/errors");
const check_access_1 = require("../permissions.ee/check-access");
const external_secrets_utils_1 = require("./external-secrets.utils");
function containsExternalSecrets(data) {
    return (0, external_secrets_utils_1.getExternalSecretExpressionPaths)(data).length > 0;
}
function isChangingExternalSecretExpression(newData, existingData) {
    const newSecretPaths = (0, external_secrets_utils_1.getExternalSecretExpressionPaths)(newData);
    for (const path of newSecretPaths) {
        const newValue = (0, get_1.default)(newData, path);
        const existingValue = (0, get_1.default)(existingData, path);
        if (newValue !== existingValue) {
            return true;
        }
    }
    return false;
}
async function validateExternalSecretsPermissions({ user, projectId, dataToSave, decryptedExistingData, }) {
    if (!dataToSave) {
        return;
    }
    const isUpdatingExistingCredential = !!decryptedExistingData;
    const needsCheck = isUpdatingExistingCredential
        ? isChangingExternalSecretExpression(dataToSave, decryptedExistingData)
        : containsExternalSecrets(dataToSave);
    if (needsCheck) {
        const hasAccess = await (0, check_access_1.userHasScopes)(user, ['externalSecret:list'], false, { projectId });
        if (!hasAccess) {
            throw new errors_1.BadRequestError('Lacking permissions to reference external secrets in credentials');
        }
    }
}
async function validateAccessToReferencedSecretProviders(projectId, data, externalSecretsProviderAccessCheckService, source) {
    if (!containsExternalSecrets(data)) {
        return;
    }
    const secretPaths = (0, external_secrets_utils_1.getExternalSecretExpressionPaths)(data);
    const providerToCredentialPropertyMap = new Map();
    for (const credentialProperty of secretPaths) {
        const expressionString = (0, get_1.default)(data, credentialProperty);
        if (typeof expressionString === 'string') {
            const providerKeys = (0, external_secrets_utils_1.extractProviderKeysFromExpression)(expressionString);
            if (providerKeys.length === 0) {
                throw new errors_1.BadRequestError(`Could not find a valid external secret vault name inside "${expressionString}" used in "${credentialProperty}"`);
            }
            for (const providerKey of providerKeys) {
                const credentialProperties = providerToCredentialPropertyMap.get(providerKey) ?? [];
                credentialProperties.push(credentialProperty);
                providerToCredentialPropertyMap.set(providerKey, credentialProperties);
            }
        }
    }
    if (providerToCredentialPropertyMap.size === 0) {
        return;
    }
    const inaccessibleProviders = new Map();
    const providerKeys = Array.from(providerToCredentialPropertyMap.keys());
    await Promise.all(providerKeys.map(async (providerKey) => {
        const hasAccess = await externalSecretsProviderAccessCheckService.isProviderAvailableInProject(providerKey, projectId);
        if (!hasAccess) {
            const credentialProperties = providerToCredentialPropertyMap.get(providerKey) ?? [];
            if (credentialProperties.length > 0) {
                inaccessibleProviders.set(providerKey, credentialProperties);
            }
        }
    }));
    if (inaccessibleProviders.size > 0) {
        const formatCredentialPropertyList = (properties) => {
            return properties.map((f) => `"${f}"`).join(', ');
        };
        const errorMessageSuffix = source === 'transfer' ? 'in the destination project' : 'in this project';
        if (inaccessibleProviders.size === 1) {
            const [providerKey, credentialProperties] = Array.from(inaccessibleProviders.entries())[0];
            const credentialPropertyList = formatCredentialPropertyList(credentialProperties);
            throw new errors_1.BadRequestError(`The secret provider "${providerKey}" used in ${credentialPropertyList} does not exist ${errorMessageSuffix}`);
        }
        else {
            const providerDetails = Array.from(inaccessibleProviders.entries())
                .map(([provider, fields]) => {
                const credentialPopertyList = formatCredentialPropertyList(fields);
                return `"${provider}" (used in ${credentialPopertyList})`;
            })
                .join(', ');
            throw new errors_1.BadRequestError(`The secret providers ${providerDetails} do not exist ${errorMessageSuffix}`);
        }
    }
}
function parseCredentialDescription(description) {
    if (description === undefined)
        return null;
    const result = api_types_1.credentialDescriptionSchema.safeParse(description);
    if (!result.success) {
        throw new errors_1.BadRequestError(result.error.issues[0].message);
    }
    return result.data;
}
//# sourceMappingURL=validation.js.map