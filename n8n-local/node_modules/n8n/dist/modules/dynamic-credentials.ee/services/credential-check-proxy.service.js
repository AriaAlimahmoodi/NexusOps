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
exports.CredentialCheckProxyService = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const credential_types_1 = require("../../../credential-types");
const credentials_service_ee_1 = require("../../../credentials/credentials.service.ee");
const node_types_1 = require("../../../node-types");
const backend_services_1 = require("@n8n/backend-services");
const n8n_core_1 = require("n8n-core");
const authorize_intent_service_1 = require("./authorize-intent.service");
const credential_resolver_workflow_service_1 = require("./credential-resolver-workflow.service");
const dynamic_credential_service_1 = require("./dynamic-credential.service");
const lightVariant = (value) => typeof value === 'string' ? value : value?.light;
let CredentialCheckProxyService = class CredentialCheckProxyService {
    constructor(credentialResolverWorkflowService, executionContextService, enterpriseCredentialsService, authorizeIntentService, dynamicCredentialService, urlService, globalConfig, credentialTypes, nodeTypes) {
        this.credentialResolverWorkflowService = credentialResolverWorkflowService;
        this.executionContextService = executionContextService;
        this.enterpriseCredentialsService = enterpriseCredentialsService;
        this.authorizeIntentService = authorizeIntentService;
        this.dynamicCredentialService = dynamicCredentialService;
        this.urlService = urlService;
        this.globalConfig = globalConfig;
        this.credentialTypes = credentialTypes;
        this.nodeTypes = nodeTypes;
    }
    async checkCredentialStatus(workflowId, executionContext, options) {
        if (!executionContext.credentials) {
            throw new Error('Execution context is present but contains no credential context. Ensure credential context establishment hooks are configured for this workflow.');
        }
        const plaintext = await this.executionContextService.decryptCredentialContext(executionContext.credentials);
        if (!plaintext) {
            throw new Error('Execution context is present but contains no credential context. Ensure credential context establishment hooks are configured for this workflow.');
        }
        const statuses = await this.credentialResolverWorkflowService.getWorkflowStatus(workflowId, plaintext, { rootNodes: options?.rootNodes });
        const credentials = await Promise.all(statuses.map(async (status) => {
            const checkStatus = {
                credentialId: status.credentialId,
                credentialName: status.credentialName,
                credentialType: status.credentialType,
                resolverId: status.resolverId,
                status: status.status,
                iconUrl: this.resolveCredentialIconUrl(status.credentialType),
            };
            if (status.status === 'missing' && status.resolverId) {
                checkStatus.authorizationUrl = await this.generateAuthorizationUrl(status.credentialId, status.resolverId, plaintext);
            }
            if (status.status === 'configured' && status.resolverId) {
                checkStatus.revokeUrl = this.generateRevokeUrl(status.credentialId, status.resolverId);
            }
            return checkStatus;
        }));
        const readyToExecute = credentials.every((c) => c.status === 'configured');
        return { readyToExecute, credentials };
    }
    resolveCredentialIconUrl(credentialType, seen = new Set()) {
        if (!credentialType || seen.has(credentialType))
            return undefined;
        seen.add(credentialType);
        let type;
        try {
            type = this.credentialTypes.getByName(credentialType);
        }
        catch {
            return undefined;
        }
        const ownIconUrl = lightVariant(type.iconUrl);
        if (ownIconUrl)
            return this.toAbsoluteIconUrl(ownIconUrl);
        const icon = lightVariant(type.icon);
        if (icon?.startsWith('node:')) {
            const nodeIconUrl = this.resolveNodeIconUrl(icon.slice('node:'.length));
            if (nodeIconUrl)
                return this.toAbsoluteIconUrl(nodeIconUrl);
        }
        for (const parentType of type.extends ?? []) {
            const inherited = this.resolveCredentialIconUrl(parentType, seen);
            if (inherited)
                return inherited;
        }
        return undefined;
    }
    resolveNodeIconUrl(nodeTypeName) {
        try {
            const { description } = this.nodeTypes.getByName(nodeTypeName);
            return lightVariant(description.iconUrl);
        }
        catch {
            return undefined;
        }
    }
    toAbsoluteIconUrl(iconUrl) {
        if (/^https?:\/\//i.test(iconUrl))
            return iconUrl;
        return `${this.urlService.getInstanceBaseUrl()}/${iconUrl.replace(/^\/+/, '')}`;
    }
    generateRevokeUrl(credentialId, resolverId) {
        const basePath = this.urlService.getInstanceBaseUrl();
        const restPath = this.globalConfig.endpoints.rest;
        return `${basePath}/${restPath}/credentials/${credentialId}/revoke?resolverId=${encodeURIComponent(resolverId)}`;
    }
    async generateAuthorizationUrl(credentialId, resolverId, credentialContext) {
        const credential = await this.enterpriseCredentialsService.getOne(credentialId);
        if (!credential)
            return undefined;
        const type = credential.type.toLowerCase();
        if (!type.includes('oauth2') && !type.includes('oauth1'))
            return undefined;
        const ownership = await this.dynamicCredentialService.resolveOwningUserIdForAuthorization(credentialContext, resolverId);
        if (ownership.status === 'unresolved')
            return undefined;
        const token = await this.authorizeIntentService.create({
            credentialId: credential.id,
            resolverId,
            identity: credentialContext.identity ?? '',
            userId: ownership.status === 'bound' ? ownership.userId : undefined,
            metadata: credentialContext.metadata,
        });
        const basePath = this.urlService.getInstanceBaseUrl();
        const restPath = this.globalConfig.endpoints.rest;
        return `${basePath}/${restPath}/credentials/${credential.id}/authorize?token=${token}`;
    }
};
exports.CredentialCheckProxyService = CredentialCheckProxyService;
exports.CredentialCheckProxyService = CredentialCheckProxyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credential_resolver_workflow_service_1.CredentialResolverWorkflowService, n8n_core_1.ExecutionContextService, credentials_service_ee_1.EnterpriseCredentialsService, authorize_intent_service_1.AuthorizeIntentService, dynamic_credential_service_1.DynamicCredentialService, backend_services_1.UrlService, config_1.GlobalConfig, credential_types_1.CredentialTypes, node_types_1.NodeTypes])
], CredentialCheckProxyService);
//# sourceMappingURL=credential-check-proxy.service.js.map