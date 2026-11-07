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
exports.DynamicCredentialsProxy = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
let DynamicCredentialsProxy = class DynamicCredentialsProxy {
    constructor(logger) {
        this.logger = logger;
    }
    setStorageProvider(provider) {
        this.storageProvider = provider;
    }
    setResolverProvider(provider) {
        this.resolvingProvider = provider;
    }
    getSystemResolverId() {
        if (!this.resolvingProvider) {
            return null;
        }
        return this.resolvingProvider.getSystemResolverId();
    }
    getEffectiveResolverId(settings) {
        return settings?.credentialResolverId ?? this.getSystemResolverId();
    }
    async resolveIfNeeded(credentialsResolveMetadata, staticData, executionContext, workflowSettings, executionId) {
        if (!this.resolvingProvider) {
            if (credentialsResolveMetadata.isResolvable) {
                this.logger.warn(`No dynamic credential resolving provider set, but trying to resolve resolvable credential "${credentialsResolveMetadata.name}"`);
                throw new Error('No dynamic credential resolving provider set');
            }
            return { data: staticData, isDynamic: false };
        }
        return await this.resolvingProvider.resolveIfNeeded(credentialsResolveMetadata, staticData, executionContext, workflowSettings, executionId);
    }
    async storeIfNeeded(credentialStoreMetadata, dynamicData, credentialContext, staticData, workflowSettings, executionId) {
        if (!this.storageProvider) {
            if (credentialStoreMetadata.isResolvable) {
                this.logger.warn(`No dynamic credential storage provider set, but trying to store resolvable credential "${credentialStoreMetadata.name}"`);
                throw new Error('No dynamic credential storage provider set');
            }
            return;
        }
        return await this.storageProvider.storeIfNeeded(credentialStoreMetadata, dynamicData, credentialContext, staticData, workflowSettings, executionId);
    }
    async storeOAuthTokenDataIfNeeded(credentialStoreMetadata, oauthTokenData, executionContext, staticData, workflowSettings, executionId) {
        if (!credentialStoreMetadata.isResolvable || !credentialStoreMetadata.resolverId) {
            return;
        }
        const cipher = di_1.Container.get(n8n_core_1.Cipher);
        let credentialContext;
        if (executionContext?.credentials) {
            const decrypted = await cipher.decryptV2(executionContext.credentials);
            credentialContext = (0, n8n_workflow_1.toCredentialContext)(decrypted);
        }
        if (!credentialContext) {
            throw new n8n_workflow_1.UnexpectedError('No credential context found', {
                extra: {
                    credentialId: credentialStoreMetadata.id,
                    credentialName: credentialStoreMetadata.name,
                },
            });
        }
        await this.storeIfNeeded(credentialStoreMetadata, { oauthTokenData }, credentialContext, staticData, workflowSettings, executionId);
    }
};
exports.DynamicCredentialsProxy = DynamicCredentialsProxy;
exports.DynamicCredentialsProxy = DynamicCredentialsProxy = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], DynamicCredentialsProxy);
//# sourceMappingURL=dynamic-credentials-proxy.js.map