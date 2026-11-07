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
exports.DynamicCredentialStorageService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const dynamic_credentials_proxy_1 = require("../../../credentials/dynamic-credentials-proxy");
const load_nodes_and_credentials_1 = require("../../../load-nodes-and-credentials");
const credential_resolver_registry_service_1 = require("./credential-resolver-registry.service");
const shared_fields_1 = require("./shared-fields");
const n8n_identifier_1 = require("../credential-resolvers/identifiers/n8n-identifier");
const credential_resolver_repository_1 = require("../database/repositories/credential-resolver.repository");
const credential_storage_error_1 = require("../errors/credential-storage.error");
const n8n_identity_not_supported_error_1 = require("../errors/n8n-identity-not-supported.error");
let DynamicCredentialStorageService = class DynamicCredentialStorageService {
    constructor(resolverRegistry, resolverRepository, loadNodesAndCredentials, cipher, logger, dynamicCredentialsProxy) {
        this.resolverRegistry = resolverRegistry;
        this.resolverRepository = resolverRepository;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.cipher = cipher;
        this.logger = logger;
        this.dynamicCredentialsProxy = dynamicCredentialsProxy;
    }
    async storeIfNeeded(credentialStoreMetadata, dynamicData, credentialContext, staticData, workflowSettings, executionId) {
        try {
            if (!credentialStoreMetadata.isResolvable) {
                return;
            }
            const resolverId = credentialStoreMetadata.resolverId ??
                this.dynamicCredentialsProxy.getEffectiveResolverId(workflowSettings);
            if (!resolverId) {
                return this.handleNoResolver(credentialStoreMetadata);
            }
            const resolverEntity = await this.resolverRepository.findOneBy({
                id: resolverId,
            });
            if (!resolverEntity) {
                return this.handleMissingResolver(credentialStoreMetadata, resolverId);
            }
            const resolver = this.resolverRegistry.getResolverByTypename(resolverEntity.type);
            if (!resolver) {
                return this.handleMissingResolver(credentialStoreMetadata, resolverId);
            }
            if ((0, n8n_identifier_1.carriesN8nIdentity)(credentialContext) && !resolver.resolveOwningUserId) {
                throw new n8n_identity_not_supported_error_1.N8nIdentityNotSupportedError(credentialStoreMetadata.name);
            }
            const decryptedConfig = await this.cipher.decryptV2(resolverEntity.config);
            const resolverConfig = (0, n8n_workflow_1.jsonParse)(decryptedConfig);
            const credentialType = this.loadNodesAndCredentials.getCredential(credentialStoreMetadata.type);
            const sharedFields = (0, shared_fields_1.extractSharedFields)(credentialType.type);
            const mergedDynamicData = {
                ...(staticData ?? {}),
                ...dynamicData,
            };
            for (const field of sharedFields) {
                if (field in mergedDynamicData) {
                    delete mergedDynamicData[field];
                }
            }
            await resolver.setSecret(credentialStoreMetadata.id, credentialContext, mergedDynamicData, {
                configuration: resolverConfig,
                resolverName: resolverEntity.name,
                resolverId: resolverEntity.id,
            }, executionId);
            this.logger.debug('Successfully stored dynamic credentials', {
                credentialId: credentialStoreMetadata.id,
                resolverId,
                resolverSource: credentialStoreMetadata.resolverId ? 'credential' : 'workflow',
            });
        }
        catch (error) {
            this.logger.error('Failed to store dynamic credentials data', {
                credentialId: credentialStoreMetadata.id,
                credentialType: credentialStoreMetadata.type,
                error,
            });
            throw new credential_storage_error_1.CredentialStorageError(`Failed to store end-user credential data for "${credentialStoreMetadata.name}"`, { cause: error });
        }
    }
    handleNoResolver(credentialStoreMetadata) {
        throw new credential_storage_error_1.CredentialStorageError(`No resolver found for credential "${credentialStoreMetadata.name}"`);
    }
    handleMissingResolver(credentialStoreMetadata, resolverId) {
        throw new credential_storage_error_1.CredentialStorageError(`Resolver "${resolverId}" not found for credential "${credentialStoreMetadata.name}"`);
    }
};
exports.DynamicCredentialStorageService = DynamicCredentialStorageService;
exports.DynamicCredentialStorageService = DynamicCredentialStorageService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credential_resolver_registry_service_1.DynamicCredentialResolverRegistry, credential_resolver_repository_1.DynamicCredentialResolverRepository, load_nodes_and_credentials_1.LoadNodesAndCredentials, n8n_core_1.Cipher, backend_common_1.Logger, dynamic_credentials_proxy_1.DynamicCredentialsProxy])
], DynamicCredentialStorageService);
//# sourceMappingURL=dynamic-credential-storage.service.js.map