"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsHelper = void 0;
exports.createCredentialsFromCredentialsEntity = createCredentialsFromCredentialsEntity;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const credential_types_1 = require("./credential-types");
const credentials_overwrites_1 = require("./credentials-overwrites");
const dcr_managed_fields_1 = require("./oauth/dcr-managed-fields");
const external_secrets_config_1 = require("./modules/external-secrets.ee/external-secrets.config");
const policy_enforcement_service_1 = require("./policy/policy-enforcement.service");
const ai_gateway_service_1 = require("./services/ai-gateway.service");
const dynamic_credentials_proxy_1 = require("./credentials/dynamic-credentials-proxy");
const mock_node_types_1 = require("./credentials/mock-node-types");
const credential_missing_id_error_1 = require("./errors/credential-missing-id.error");
const credential_not_found_error_1 = require("./errors/credential-not-found.error");
const unsupported_end_user_credential_trigger_error_1 = require("./errors/unsupported-end-user-credential-trigger.error");
function restrictToCredentialDomains(helpers, credentials) {
    return {
        helpers: {
            httpRequest: async (requestOptions) => {
                const allowedDomains = (0, n8n_workflow_1.getCredentialOwnRequestAllowedDomains)(credentials);
                if (allowedDomains === undefined) {
                    return await helpers.helpers.httpRequest(requestOptions);
                }
                if (requestOptions.allowedDomains !== undefined) {
                    throw new n8n_workflow_1.UserError('This credential restricts requests to specific domains, which cannot be combined with the domains its authentication step asks for.');
                }
                return await helpers.helpers.httpRequest({ ...requestOptions, allowedDomains });
            },
        },
    };
}
const mockNode = {
    name: '',
    typeVersion: 1,
    type: 'mock',
    position: [0, 0],
    parameters: {},
};
const { nodeTypes: mockNodeTypes } = (0, mock_node_types_1.createMockNodeTypes)();
const INVALID_JSON_VALUE = Symbol('invalidJsonValue');
function decryptActor({ executionId, userId }) {
    if (executionId)
        return { kind: 'system', reason: 'execution', executionId };
    if (userId)
        return { kind: 'user', user: { id: userId } };
    return { kind: 'system', reason: 'execution' };
}
let CredentialsHelper = class CredentialsHelper extends n8n_workflow_1.ICredentialsHelper {
    constructor(credentialTypes, credentialsOverwrites, credentialsRepository, dynamicCredentialsProxy, secretsProviderConnectionRepository, licenseState, externalSecretsConfig, aiGatewayService, policyEnforcementService) {
        super();
        this.credentialTypes = credentialTypes;
        this.credentialsOverwrites = credentialsOverwrites;
        this.credentialsRepository = credentialsRepository;
        this.dynamicCredentialsProxy = dynamicCredentialsProxy;
        this.secretsProviderConnectionRepository = secretsProviderConnectionRepository;
        this.licenseState = licenseState;
        this.externalSecretsConfig = externalSecretsConfig;
        this.aiGatewayService = aiGatewayService;
        this.policyEnforcementService = policyEnforcementService;
        this.storedDataByDecrypted = new WeakMap();
    }
    async authenticate(credentials, typeName, incomingRequestOptions, workflow, node) {
        const requestOptions = incomingRequestOptions;
        const credentialType = this.credentialTypes.getByName(typeName);
        if (credentialType.authenticate) {
            if (typeof credentialType.authenticate === 'function') {
                return await credentialType.authenticate(credentials, requestOptions);
            }
            if (typeof credentialType.authenticate === 'object') {
                if (!workflow || !node) {
                    throw new n8n_workflow_1.UnexpectedError('Workflow and node are required for declarative credential authentication');
                }
                let keyResolved;
                let valueResolved;
                const { authenticate } = credentialType;
                if (requestOptions.headers === undefined) {
                    requestOptions.headers = {};
                }
                if (authenticate.type === 'generic') {
                    Object.entries(authenticate.properties).forEach(([outerKey, outerValue]) => {
                        Object.entries(outerValue).forEach(([key, value]) => {
                            keyResolved = this.resolveValue(key, { $credentials: credentials }, workflow, node);
                            valueResolved = this.resolveValue(value, { $credentials: credentials }, workflow, node);
                            if (!requestOptions[outerKey]) {
                                requestOptions[outerKey] = {};
                            }
                            requestOptions[outerKey][keyResolved] = valueResolved;
                        });
                    });
                }
            }
        }
        return requestOptions;
    }
    async preAuthentication(helpers, credentials, typeName, node, credentialsExpired) {
        const credentialType = this.credentialTypes.getByName(typeName);
        const expirableProperty = credentialType.properties.find((property) => property.type === 'hidden' && property?.typeOptions?.expirable === true);
        if (expirableProperty?.name === undefined) {
            return undefined;
        }
        const isTestingCredentials = node?.parameters?.temp === '' && node?.type === 'n8n-nodes-base.noOp';
        if (credentialType.preAuthentication) {
            if (typeof credentialType.preAuthentication === 'function') {
                if (credentials[expirableProperty?.name] === '' ||
                    credentialsExpired ||
                    isTestingCredentials) {
                    const output = await credentialType.preAuthentication.call(restrictToCredentialDomains(helpers, credentials), credentials);
                    if (output[expirableProperty.name] === undefined) {
                        return undefined;
                    }
                    if (node.credentials) {
                        const nodeCredentials = node.credentials[credentialType.name];
                        const storedData = await (await this.getCredentials(nodeCredentials, credentialType.name)).getData();
                        const dataToPersist = { ...storedData };
                        for (const [key, value] of Object.entries(output)) {
                            if (key === expirableProperty.name || !(0, n8n_workflow_1.isExpression)(storedData[key])) {
                                dataToPersist[key] = value;
                            }
                        }
                        await this.updateCredentials(nodeCredentials, credentialType.name, dataToPersist);
                        return Object.assign(credentials, output);
                    }
                }
            }
        }
        return undefined;
    }
    async runPreAuthentication(helpers, credentials, typeName) {
        const credentialType = this.credentialTypes.getByName(typeName);
        if (typeof credentialType.preAuthentication !== 'function') {
            return undefined;
        }
        const output = await credentialType.preAuthentication.call(restrictToCredentialDomains(helpers, credentials), credentials);
        return output ?? undefined;
    }
    resolveValue(parameterValue, additionalKeys, workflow, node) {
        if (!(0, n8n_workflow_1.isExpression)(parameterValue)) {
            return parameterValue;
        }
        const returnValue = workflow.expression.getSimpleParameterValue(node, parameterValue, 'internal', additionalKeys, undefined, '');
        if (!returnValue) {
            return '';
        }
        return returnValue.toString();
    }
    getParentTypes(typeName) {
        return this.credentialTypes.getParentTypes(typeName);
    }
    async getCredentials(nodeCredential, type) {
        const credential = await this.getCredentialsEntity(nodeCredential, type);
        return new n8n_core_1.Credentials({ id: credential.id, name: credential.name }, credential.type, credential.data);
    }
    async getCredentialsEntity(nodeCredential, type) {
        if (!nodeCredential.id) {
            throw new credential_missing_id_error_1.CredentialMissingIdError(nodeCredential.name, type);
        }
        let credential;
        try {
            credential = await this.credentialsRepository.findOneByOrFail({
                id: nodeCredential.id,
                type,
            });
        }
        catch (error) {
            if ((0, db_1.isEntityNotFoundError)(error)) {
                throw new credential_not_found_error_1.CredentialNotFoundError(nodeCredential.id, type);
            }
            throw error;
        }
        if (credential.usageScope !== 'project') {
            throw new n8n_workflow_1.UserError('This credential cannot be used in workflows');
        }
        return credential;
    }
    isCredentialUsableByNode(credentialType, nodeType) {
        let typeDef;
        try {
            typeDef = this.credentialTypes.getByName(credentialType);
        }
        catch {
            return true;
        }
        if (!typeDef.restrictToSupportedNodes)
            return true;
        return this.credentialTypes.getSupportedNodes(credentialType).includes(nodeType);
    }
    getCredentialsProperties(type) {
        const credentialTypeData = this.credentialTypes.getByName(type);
        if (credentialTypeData === undefined) {
            throw new n8n_workflow_1.UnexpectedError('Unknown credential type', { tags: { credentialType: type } });
        }
        if (credentialTypeData.extends === undefined) {
            if (['oAuth1Api', 'oAuth2Api'].includes(type)) {
                return [
                    ...credentialTypeData.properties,
                    {
                        displayName: 'oauthTokenData',
                        name: 'oauthTokenData',
                        type: 'json',
                        required: false,
                        default: {},
                    },
                ];
            }
            return credentialTypeData.properties;
        }
        const combineProperties = [];
        for (const credentialsTypeName of credentialTypeData.extends) {
            const mergeCredentialProperties = this.getCredentialsProperties(credentialsTypeName);
            n8n_workflow_1.NodeHelpers.mergeNodeProperties(combineProperties, mergeCredentialProperties);
        }
        n8n_workflow_1.NodeHelpers.mergeNodeProperties(combineProperties, credentialTypeData.properties);
        return combineProperties;
    }
    resolveCredentialExpressions(workflow, credentialsProperties, decryptedData, mode, additionalKeys, selfData) {
        try {
            return workflow.expression.getComplexParameterValue(mockNode, decryptedData, mode, additionalKeys, undefined, undefined, selfData);
        }
        catch (error) {
            return this.resolveCredentialExpressionsByProperty(workflow, credentialsProperties, decryptedData, mode, additionalKeys, selfData, error);
        }
    }
    resolveCredentialExpressionsByProperty(workflow, credentialsProperties, decryptedData, mode, additionalKeys, selfData, originalError) {
        const propertiesByName = new Map(credentialsProperties.map((property) => [property.name, property]));
        const resolvedData = {};
        for (const [propertyName, propertyValue] of Object.entries(decryptedData)) {
            try {
                const resolvedProperty = workflow.expression.getComplexParameterValue(mockNode, { [propertyName]: propertyValue }, mode, additionalKeys, undefined, undefined, selfData);
                if (Object.prototype.hasOwnProperty.call(resolvedProperty, propertyName)) {
                    resolvedData[propertyName] = resolvedProperty[propertyName];
                }
            }
            catch {
                const credentialProperty = propertiesByName.get(propertyName);
                if (credentialProperty?.typeOptions?.ignoreCredentialExpressionResolveError === true) {
                    continue;
                }
                throw originalError;
            }
        }
        return resolvedData;
    }
    parseJsonLeafExpressionFields(credentialsProperties, decryptedData) {
        const parsedFields = new Map();
        for (const property of credentialsProperties) {
            if (!property.typeOptions?.resolveCredentialJsonLeaves)
                continue;
            const value = decryptedData[property.name];
            if (typeof value !== 'string' || value === '')
                continue;
            const parsed = (0, n8n_workflow_1.jsonParse)(value, {
                fallbackValue: INVALID_JSON_VALUE,
            });
            if (parsed === INVALID_JSON_VALUE)
                continue;
            parsedFields.set(property.name, value);
            decryptedData[property.name] = parsed;
        }
        return parsedFields;
    }
    stringifyJsonLeafExpressionFields(decryptedData, parsedFields) {
        for (const [propertyName, originalValue] of parsedFields) {
            const serializedValue = JSON.stringify(decryptedData[propertyName]);
            decryptedData[propertyName] = serializedValue ?? originalValue;
        }
    }
    assertTriggerSupportsEndUserCredential(credentialsEntity, additionalData, executeData) {
        if (!executeData)
            return;
        const resolverId = credentialsEntity.resolverId ??
            this.dynamicCredentialsProxy.getEffectiveResolverId(additionalData.workflowSettings);
        if (!resolverId)
            return;
        const isSystemResolver = resolverId === api_types_1.SYSTEM_RESOLVER_ID;
        const { providesN8nIdentity, providesExternalIdentity } = (0, n8n_workflow_1.classifyTriggerIdentity)(executeData.node.type, executeData.node.parameters);
        const supportsResolver = isSystemResolver ? providesN8nIdentity : providesExternalIdentity;
        if (!supportsResolver) {
            throw new unsupported_end_user_credential_trigger_error_1.UnsupportedEndUserCredentialTriggerError(isSystemResolver ? 'system' : 'custom');
        }
    }
    async getDecrypted(additionalData, nodeCredentials, type, mode, executeData, raw, expressionResolveValues, options) {
        const consumerNode = expressionResolveValues?.node ?? executeData?.node;
        if (nodeCredentials.__aiGatewayManaged) {
            const { userId, workflowId, projectId, executionId } = additionalData;
            return await this.aiGatewayService.getSyntheticCredential({
                credentialType: type,
                userId,
                workflowId,
                projectId,
                executionId,
                node: consumerNode,
            });
        }
        const credentialsEntity = await this.getCredentialsEntity(nodeCredentials, type);
        if (credentialsEntity.isManaged &&
            consumerNode &&
            n8n_core_1.FULL_ACCESS_NODE_TYPES.has(consumerNode.type)) {
            throw new n8n_workflow_1.UserError('Managed credentials are not supported by this node');
        }
        await this.policyEnforcementService.enforceCredentialDecrypt({
            credentialType: type,
            credentialId: credentialsEntity.id,
            consumer: consumerNode ? { nodeType: consumerNode.type } : null,
            projectId: additionalData.projectId ?? null,
        }, options?.actor ?? decryptActor(additionalData));
        const credentials = new n8n_core_1.Credentials({ id: credentialsEntity.id, name: credentialsEntity.name }, credentialsEntity.type, credentialsEntity.data);
        let decryptedDataOriginal = await credentials.getData();
        const effectiveMode = additionalData.rootExecutionMode ?? mode;
        const skipDynamicResolution = effectiveMode === 'manual' || effectiveMode === 'internal';
        const isManualTriggerCredentialRequest = effectiveMode === 'manual' &&
            options?.credentialUsage === 'trigger' &&
            credentialsEntity.isResolvable;
        const shouldAttemptDynamicResolution = additionalData.executionContext?.credentials !== undefined ||
            isManualTriggerCredentialRequest ||
            !skipDynamicResolution;
        if (shouldAttemptDynamicResolution && credentialsEntity.isResolvable) {
            additionalData.currentNodeAttemptedDynamicCredentials = true;
        }
        if (isManualTriggerCredentialRequest &&
            additionalData.executionContext?.credentials === undefined) {
            this.assertTriggerSupportsEndUserCredential(credentialsEntity, additionalData, executeData);
        }
        if (shouldAttemptDynamicResolution) {
            const resolveResult = await this.dynamicCredentialsProxy.resolveIfNeeded({
                id: credentialsEntity.id,
                name: credentialsEntity.name,
                type: credentialsEntity.type,
                isResolvable: credentialsEntity.isResolvable,
                resolverId: credentialsEntity.resolverId ?? undefined,
            }, decryptedDataOriginal, additionalData.executionContext, additionalData.workflowSettings, additionalData.executionId);
            decryptedDataOriginal = resolveResult.data;
            if (resolveResult.isDynamic) {
                additionalData.currentNodeUsedDynamicCredentials = true;
                if (resolveResult.resolvedUserId) {
                    additionalData.dynamicCredentialsResolvedUserId = resolveResult.resolvedUserId;
                }
            }
        }
        if (raw === true) {
            return this.trackStoredData(decryptedDataOriginal, credentialsEntity);
        }
        if (this.licenseState.isExternalSecretsLicensed() &&
            this.externalSecretsConfig.externalSecretsForProjects) {
            const accessibleProviderKeys = await this.secretsProviderConnectionRepository.findAllAccessibleProviderKeysByCredentialId(credentialsEntity.id);
            additionalData.externalSecretProviderKeysAccessibleByCredential = new Set(accessibleProviderKeys);
        }
        const decryptedData = await this.applyDefaultsAndOverwrites(additionalData, decryptedDataOriginal, type, mode, executeData, expressionResolveValues);
        return this.trackStoredData(decryptedData, credentialsEntity);
    }
    trackStoredData(decryptedData, credentialsEntity) {
        if (credentialsEntity.data) {
            this.storedDataByDecrypted.set(decryptedData, credentialsEntity.data);
        }
        return decryptedData;
    }
    async applyDefaultsAndOverwrites(additionalData, decryptedDataOriginal, type, mode, executeData, expressionResolveValues) {
        const credentialsProperties = this.getCredentialsProperties(type);
        const storedData = { ...decryptedDataOriginal };
        for (const field of dcr_managed_fields_1.OAUTH_PINNED_FIELDS) {
            if (credentialsProperties.some((p) => p.name === field && p.type === 'hidden')) {
                delete storedData[field];
            }
        }
        const dataWithOverwrites = this.credentialsOverwrites.applyOverwrite(type, storedData);
        let decryptedData = n8n_workflow_1.NodeHelpers.getNodeParameters(credentialsProperties, dataWithOverwrites, true, false, null, null);
        if (decryptedDataOriginal.oauthTokenData !== undefined) {
            decryptedData.oauthTokenData = decryptedDataOriginal.oauthTokenData;
        }
        if (decryptedData.allowedHttpRequestDomains === undefined &&
            decryptedDataOriginal.allowedHttpRequestDomains !== undefined) {
            decryptedData.allowedHttpRequestDomains = decryptedDataOriginal.allowedHttpRequestDomains;
        }
        if (decryptedData.allowedDomains === undefined &&
            decryptedDataOriginal.allowedDomains !== undefined) {
            decryptedData.allowedDomains = decryptedDataOriginal.allowedDomains;
        }
        if (decryptedData.useDynamicClientRegistration) {
            for (const field of dcr_managed_fields_1.DCR_MANAGED_CREDENTIAL_FIELDS) {
                decryptedData[field] = decryptedDataOriginal[field];
            }
        }
        const parsedJsonLeafExpressionFields = this.parseJsonLeafExpressionFields(credentialsProperties, decryptedData);
        const additionalKeys = (0, n8n_core_1.getAdditionalKeys)(additionalData, mode, null, {
            isCredential: true,
        });
        const selfData = { ...decryptedData };
        for (const { name, typeOptions } of credentialsProperties) {
            if ((typeOptions?.password || typeOptions?.expirable) &&
                dataWithOverwrites[name] !== storedData[name]) {
                delete selfData[name];
            }
        }
        if (expressionResolveValues) {
            try {
                decryptedData = expressionResolveValues.workflow.expression.getParameterValue(decryptedData, expressionResolveValues.runExecutionData, expressionResolveValues.runIndex, expressionResolveValues.itemIndex, expressionResolveValues.node.name, expressionResolveValues.connectionInputData, mode, additionalKeys, executeData, false, selfData);
            }
            catch (e) {
                e.message += ' [Error resolving credentials]';
                throw e;
            }
        }
        else {
            const workflow = new n8n_workflow_1.Workflow({
                nodes: [mockNode],
                connections: {},
                active: false,
                nodeTypes: mockNodeTypes,
            });
            await workflow.expression.acquireIsolate();
            try {
                decryptedData = this.resolveCredentialExpressions(workflow, credentialsProperties, decryptedData, mode, additionalKeys, selfData);
            }
            finally {
                await workflow.expression.releaseIsolate();
            }
        }
        this.stringifyJsonLeafExpressionFields(decryptedData, parsedJsonLeafExpressionFields);
        return decryptedData;
    }
    async updateCredentials(nodeCredentials, type, data) {
        const credentials = await this.getCredentials(nodeCredentials, type);
        await credentials.setData(data);
        const newCredentialsData = {
            data: credentials.getDataToSave().data,
            updatedAt: new Date(),
        };
        const findQuery = {
            id: credentials.id,
            type,
        };
        await this.credentialsRepository.update(findQuery, newCredentialsData);
    }
    async updateCredentialsOauthTokenData(nodeCredentials, type, data, additionalData) {
        const credentialsEntity = await this.getCredentialsEntity(nodeCredentials, type);
        const resolverId = credentialsEntity.resolverId ??
            this.dynamicCredentialsProxy.getEffectiveResolverId(additionalData.workflowSettings);
        if (credentialsEntity.isResolvable &&
            resolverId &&
            additionalData.executionContext?.credentials) {
            const credentials = await this.getCredentials(nodeCredentials, type);
            const staticData = await credentials.getData();
            await this.dynamicCredentialsProxy.storeOAuthTokenDataIfNeeded({
                id: credentialsEntity.id,
                name: credentialsEntity.name,
                type: credentialsEntity.type,
                isResolvable: credentialsEntity.isResolvable,
                resolverId,
            }, data.oauthTokenData, additionalData.executionContext, staticData, additionalData.workflowSettings, additionalData.executionId);
            return;
        }
        const credentials = await this.getCredentials(nodeCredentials, type);
        const storedData = this.storedDataByDecrypted.get(data);
        if (storedData !== undefined && storedData !== credentials.data) {
            return;
        }
        await credentials.updateData({ oauthTokenData: data.oauthTokenData });
        const { data: newData } = credentials.getDataToSave();
        if (newData === undefined) {
            throw new n8n_workflow_1.UnexpectedError('Credential data is missing after re-encryption');
        }
        const newCredentialsData = {
            data: newData,
            updatedAt: new Date(),
        };
        if (storedData === undefined) {
            await this.credentialsRepository.update({ id: credentials.id, type }, newCredentialsData);
            return;
        }
        const written = await this.credentialsRepository.updateDataIfUnchanged(credentialsEntity.id, type, storedData, newData);
        if (written) {
            this.storedDataByDecrypted.set(data, newData);
        }
    }
};
exports.CredentialsHelper = CredentialsHelper;
exports.CredentialsHelper = CredentialsHelper = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credential_types_1.CredentialTypes, credentials_overwrites_1.CredentialsOverwrites, db_1.CredentialsRepository, dynamic_credentials_proxy_1.DynamicCredentialsProxy, db_1.SecretsProviderConnectionRepository, backend_common_1.LicenseState, external_secrets_config_1.ExternalSecretsConfig, ai_gateway_service_1.AiGatewayService, policy_enforcement_service_1.PolicyEnforcementService])
], CredentialsHelper);
function createCredentialsFromCredentialsEntity(credential, encrypt = false) {
    const { id, name, type, data } = credential;
    if (encrypt) {
        return new n8n_core_1.Credentials({ id: null, name }, type);
    }
    return new n8n_core_1.Credentials({ id, name }, type, data);
}
//# sourceMappingURL=credentials-helper.js.map