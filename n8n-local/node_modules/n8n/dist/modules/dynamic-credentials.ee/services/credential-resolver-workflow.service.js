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
exports.CredentialResolverWorkflowService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const dynamic_credentials_proxy_1 = require("../../../credentials/dynamic-credentials-proxy");
const errors_1 = require("@n8n/errors");
const workflow_finder_service_1 = require("../../../workflows/workflow-finder.service");
const credential_resolver_registry_service_1 = require("./credential-resolver-registry.service");
const n8n_identifier_1 = require("../credential-resolvers/identifiers/n8n-identifier");
const credential_resolver_repository_1 = require("../database/repositories/credential-resolver.repository");
const MAX_TRAVERSED_WORKFLOWS = 100;
function isCredentialStatus(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    return ('credentialId' in obj &&
        typeof obj.credentialId === 'string' &&
        'credentialType' in obj &&
        typeof obj.credentialType === 'string' &&
        'status' in obj &&
        (obj.status === 'missing' || obj.status === 'configured' || obj.status === 'resolver_missing'));
}
let CredentialResolverWorkflowService = class CredentialResolverWorkflowService {
    constructor(workflowRepository, credentialRepository, resolverRegistry, resolverRepository, cipher, dynamicCredentialsProxy, workflowFinderService) {
        this.workflowRepository = workflowRepository;
        this.credentialRepository = credentialRepository;
        this.resolverRegistry = resolverRegistry;
        this.resolverRepository = resolverRepository;
        this.cipher = cipher;
        this.dynamicCredentialsProxy = dynamicCredentialsProxy;
        this.workflowFinderService = workflowFinderService;
    }
    async getResolver(resolverId) {
        const resolver = await this.resolverRepository.findOneBy({ id: resolverId });
        if (!resolver) {
            throw new Error('Credential resolver not found');
        }
        const resolverInstance = this.resolverRegistry.getResolverByTypename(resolver.type);
        if (!resolverInstance) {
            throw new Error('Credential resolver implementation not found');
        }
        try {
            const decryptedConfig = await this.cipher.decryptV2(resolver.config);
            const resolverConfig = (0, n8n_workflow_1.jsonParse)(decryptedConfig);
            return {
                resolverInstance,
                resolverConfig,
            };
        }
        catch (error) {
            throw new Error('Failed to decrypt or parse resolver configuration');
        }
    }
    async getWorkflowStatus(workflowId, credentialContext, options = {}) {
        const { user, rootNodes } = options;
        const visited = new Set();
        const credentialFallbackResolvers = new Map();
        await this.collectResolvableCredentials(workflowId, credentialFallbackResolvers, visited, user, true, rootNodes);
        if (credentialFallbackResolvers.size === 0) {
            return [];
        }
        const credentials = await this.credentialRepository.find({
            where: {
                id: (0, db_1.In)([...credentialFallbackResolvers.keys()]),
                isResolvable: true,
            },
        });
        const resolverCache = new Map();
        const credentialChecks = credentials.flatMap((credential) => {
            const fallbacks = credential.resolverId
                ? [null]
                : [...(credentialFallbackResolvers.get(credential.id) ?? [null])];
            return fallbacks.map((fallbackResolverId) => ({ credential, fallbackResolverId }));
        });
        const credentialStatusPromises = credentialChecks.map(async ({ credential, fallbackResolverId }) => await this.checkCredentialStatus(credential, {
            fallbackResolverId,
            credentialContext,
            resolverCache,
        }));
        return (await Promise.all(credentialStatusPromises)).filter(isCredentialStatus);
    }
    async collectResolvableCredentials(workflowId, acc, visited, user, isRoot, rootNodesOverride) {
        if (visited.has(workflowId)) {
            return;
        }
        if (visited.size >= MAX_TRAVERSED_WORKFLOWS) {
            throw new errors_1.BadRequestError(`Workflow references too many sub-workflows to check (limit ${MAX_TRAVERSED_WORKFLOWS})`);
        }
        visited.add(workflowId);
        const workflow = isRoot && user
            ? await this.workflowFinderService.findWorkflowForUser(workflowId, user, ['workflow:read'])
            : await this.workflowRepository.get({ id: workflowId });
        if (!workflow) {
            if (isRoot) {
                throw new errors_1.NotFoundError('Workflow not found');
            }
            return;
        }
        const resolverId = this.dynamicCredentialsProxy.getEffectiveResolverId(workflow.settings);
        const nodeSource = isRoot && rootNodesOverride ? rootNodesOverride : (workflow.nodes ?? []);
        const runnableNodes = nodeSource.filter((node) => !node.disabled);
        for (const node of runnableNodes) {
            for (const credentialName in node.credentials ?? {}) {
                const credentialId = node.credentials?.[credentialName]?.id;
                if (!credentialId) {
                    continue;
                }
                const fallbacks = acc.get(credentialId) ?? new Set();
                fallbacks.add(resolverId);
                acc.set(credentialId, fallbacks);
            }
        }
        for (const subWorkflowId of this.extractSubWorkflowIds(runnableNodes)) {
            await this.collectResolvableCredentials(subWorkflowId, acc, visited, user, false, undefined);
        }
    }
    extractSubWorkflowIds(nodes) {
        const ids = new Set();
        for (const node of nodes) {
            if (node.disabled || !(0, n8n_workflow_1.isNodeWithWorkflowSelector)(node)) {
                continue;
            }
            const source = node.parameters?.source;
            if (source === 'parameter' || source === 'localFile' || source === 'url') {
                continue;
            }
            const subWorkflowId = this.extractWorkflowId(node.parameters?.workflowId);
            if (subWorkflowId && !subWorkflowId.includes('{')) {
                ids.add(subWorkflowId);
            }
        }
        return [...ids];
    }
    extractWorkflowId(workflowIdParam) {
        if (typeof workflowIdParam === 'string') {
            return workflowIdParam;
        }
        if (typeof workflowIdParam === 'object' &&
            workflowIdParam !== null &&
            'value' in workflowIdParam &&
            typeof workflowIdParam.value === 'string') {
            return workflowIdParam.value;
        }
        return undefined;
    }
    async getCachedResolver(resolverId, cache) {
        const cached = cache.get(resolverId);
        if (cached) {
            return cached;
        }
        const resolved = await this.getResolver(resolverId);
        cache.set(resolverId, resolved);
        return resolved;
    }
    async checkCredentialStatus(credential, options) {
        const credentialResolverId = credential.resolverId ?? options.fallbackResolverId;
        if (!credentialResolverId) {
            return {
                credentialId: credential.id,
                credentialName: credential.name,
                status: 'resolver_missing',
                credentialType: credential.type,
            };
        }
        const { resolverInstance, resolverConfig } = await this.getCachedResolver(credentialResolverId, options.resolverCache);
        if ((0, n8n_identifier_1.carriesN8nIdentity)(options.credentialContext) && !resolverInstance.resolveOwningUserId) {
            return {
                credentialId: credential.id,
                credentialName: credential.name,
                status: 'resolver_missing',
                credentialType: credential.type,
            };
        }
        try {
            await resolverInstance.getSecret(credential.id, options.credentialContext, {
                configuration: resolverConfig,
                resolverName: resolverInstance.metadata.name,
                resolverId: credentialResolverId,
            });
            return {
                credentialId: credential.id,
                resolverId: credentialResolverId,
                credentialName: credential.name,
                status: 'configured',
                credentialType: credential.type,
            };
        }
        catch (error) {
            return {
                credentialId: credential.id,
                resolverId: credentialResolverId,
                credentialName: credential.name,
                status: 'missing',
                credentialType: credential.type,
            };
        }
    }
};
exports.CredentialResolverWorkflowService = CredentialResolverWorkflowService;
exports.CredentialResolverWorkflowService = CredentialResolverWorkflowService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowRepository, db_1.CredentialsRepository, credential_resolver_registry_service_1.DynamicCredentialResolverRegistry, credential_resolver_repository_1.DynamicCredentialResolverRepository, n8n_core_1.Cipher, dynamic_credentials_proxy_1.DynamicCredentialsProxy, workflow_finder_service_1.WorkflowFinderService])
], CredentialResolverWorkflowService);
//# sourceMappingURL=credential-resolver-workflow.service.js.map