"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSamlPreferences = void 0;
exports.setSamlLoginEnabled = setSamlLoginEnabled;
exports.setSamlLoginLabel = setSamlLoginLabel;
exports.createUserFromSamlAttributes = createUserFromSamlAttributes;
exports.updateUserFromSamlAttributes = updateUserFromSamlAttributes;
exports.getMappedSamlAttributesFromFlowResult = getMappedSamlAttributesFromFlowResult;
exports.isConnectionTestRequest = isConnectionTestRequest;
exports.extractTestIdFromRelayState = extractTestIdFromRelayState;
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const password_utility_1 = require("../../services/password.utility");
const sso_helpers_1 = require("../../sso.ee/sso-helpers");
const service_provider_ee_1 = require("./service-provider.ee");
async function setSamlLoginEnabled(enabled) {
    const currentAuthenticationMethod = (0, sso_helpers_1.getCurrentAuthenticationMethod)();
    if (enabled) {
        (0, sso_helpers_1.assertAuthenticationMethodCanBeEnabled)('saml');
    }
    const targetAuthenticationMethod = !enabled && currentAuthenticationMethod === 'saml' ? 'email' : currentAuthenticationMethod;
    di_1.Container.get(config_1.GlobalConfig).sso.saml.loginEnabled = enabled;
    await (0, sso_helpers_1.setCurrentAuthenticationMethod)(enabled ? 'saml' : targetAuthenticationMethod);
}
function setSamlLoginLabel(label) {
    di_1.Container.get(config_1.GlobalConfig).sso.saml.loginLabel = label;
}
const isSamlPreferences = (candidate) => {
    const o = candidate;
    return (typeof o === 'object' &&
        typeof o.metadata === 'string' &&
        typeof o.mapping === 'object' &&
        o.mapping !== null &&
        o.loginEnabled !== undefined);
};
exports.isSamlPreferences = isSamlPreferences;
async function createUserFromSamlAttributes(attributes) {
    const randomPassword = (0, n8n_workflow_1.randomString)(18);
    const userRepository = di_1.Container.get(db_1.UserRepository);
    return await userRepository.manager.transaction(async (trx) => {
        const { user } = await userRepository.createUserWithProject({
            email: attributes.email.toLowerCase(),
            firstName: attributes.firstName,
            lastName: attributes.lastName,
            role: { slug: 'global:member' },
            password: await di_1.Container.get(password_utility_1.PasswordUtility).hash(randomPassword),
        }, trx);
        await trx.save(trx.create(db_1.AuthIdentity, {
            providerId: attributes.userPrincipalName,
            providerType: 'saml',
            userId: user.id,
        }));
        return user;
    });
}
async function updateUserFromSamlAttributes(user, attributes) {
    if (!attributes.email)
        throw new errors_1.AuthError('Email is required to update user');
    if (!user)
        throw new errors_1.AuthError('User not found');
    let samlAuthIdentity = user?.authIdentities.find((e) => e.providerType === 'saml');
    if (!samlAuthIdentity) {
        samlAuthIdentity = new db_1.AuthIdentity();
        samlAuthIdentity.providerId = attributes.userPrincipalName;
        samlAuthIdentity.providerType = 'saml';
        samlAuthIdentity.user = user;
        user.authIdentities.push(samlAuthIdentity);
    }
    else {
        samlAuthIdentity.providerId = attributes.userPrincipalName;
    }
    await di_1.Container.get(db_1.AuthIdentityRepository).save(samlAuthIdentity, { transaction: false });
    user.firstName = attributes.firstName;
    user.lastName = attributes.lastName;
    const resultUser = await di_1.Container.get(db_1.UserRepository).save(user, { transaction: false });
    if (!resultUser)
        throw new errors_1.AuthError('Could not update User');
    const userWithRole = await di_1.Container.get(db_1.UserRepository).findOne({
        where: { id: resultUser.id },
        relations: ['role'],
        transaction: false,
    });
    if (!userWithRole)
        throw new errors_1.AuthError('Failed to fetch user!');
    return userWithRole;
}
function getMappedSamlAttributesFromFlowResult(flowResult, attributeMapping, jitClaimNames) {
    const result = {
        attributes: undefined,
        missingAttributes: [],
        rawAttributes: {},
    };
    if (flowResult?.extract?.attributes) {
        const attributes = flowResult.extract.attributes;
        result.rawAttributes = attributes;
        const email = attributes[attributeMapping.email];
        const firstName = attributes[attributeMapping.firstName];
        const lastName = attributes[attributeMapping.lastName];
        const userPrincipalName = attributes[attributeMapping.userPrincipalName];
        result.attributes = {
            email,
            firstName,
            lastName,
            userPrincipalName,
        };
        if (attributeMapping.emailVerified) {
            const emailVerified = attributes[attributeMapping.emailVerified];
            result.attributes.emailVerified = Array.isArray(emailVerified)
                ? emailVerified[0]
                : emailVerified;
        }
        if (jitClaimNames.instanceRole && typeof attributes[jitClaimNames.instanceRole] === 'string') {
            result.attributes.n8nInstanceRole = attributes[jitClaimNames.instanceRole];
        }
        if (jitClaimNames.projectRoles && attributes[jitClaimNames.projectRoles]) {
            const projectRolesFromFlowResult = attributes[jitClaimNames.projectRoles];
            result.attributes.n8nProjectRoles = Array.isArray(projectRolesFromFlowResult)
                ? projectRolesFromFlowResult
                : [projectRolesFromFlowResult];
        }
        if (!email)
            result.missingAttributes.push(attributeMapping.email);
        if (!userPrincipalName)
            result.missingAttributes.push(attributeMapping.userPrincipalName);
        if (!firstName)
            result.missingAttributes.push(attributeMapping.firstName);
        if (!lastName)
            result.missingAttributes.push(attributeMapping.lastName);
    }
    return result;
}
function isConnectionTestRequest(payload) {
    if (!payload.RelayState)
        return false;
    return payload.RelayState.startsWith((0, service_provider_ee_1.getServiceProviderConfigTestReturnUrl)());
}
function extractTestIdFromRelayState(relayState) {
    if (!relayState)
        return undefined;
    try {
        const url = new URL(relayState);
        return url.searchParams.get('t') ?? undefined;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=saml-helpers.js.map