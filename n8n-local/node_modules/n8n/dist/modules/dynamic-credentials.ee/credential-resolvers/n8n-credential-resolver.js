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
exports.N8NCredentialResolver = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const n8n_identifier_1 = require("./identifiers/n8n-identifier");
const dynamic_credential_user_entry_storage_1 = require("./storage/dynamic-credential-user-entry-storage");
let N8NCredentialResolver = class N8NCredentialResolver {
    constructor(logger, n8nIdentifier, storage, cipher) {
        this.logger = logger;
        this.n8nIdentifier = n8nIdentifier;
        this.storage = storage;
        this.cipher = cipher;
        this.metadata = {
            name: 'credential-resolver.n8n-1.0',
            description: 'N8N based credential resolver',
            displayName: 'N8N Resolver',
            options: [],
        };
    }
    async getSecret(credentialId, context, handle, executionId) {
        const key = await this.resolveIdentifier(context, handle.configuration, executionId);
        const data = await this.storage.getCredentialData(credentialId, key, handle.resolverId, handle.configuration);
        if (!data) {
            throw new decorators_1.CredentialResolverDataNotFoundError();
        }
        const plaintext = await this.cipher.decryptV2(data);
        try {
            const secret = (0, n8n_workflow_1.jsonParse)(plaintext);
            return secret;
        }
        catch (error) {
            this.logger.error('Failed to parse decrypted credential data', { error });
            throw new decorators_1.CredentialResolverDataNotFoundError();
        }
    }
    async setSecret(credentialId, context, data, handle, executionId) {
        const key = await this.resolveIdentifier(context, handle.configuration, executionId);
        const encryptedData = await this.cipher.encryptV2(data);
        await this.storage.setCredentialData(credentialId, key, handle.resolverId, encryptedData, handle.configuration);
    }
    async deleteSecret(credentialId, context, handle, executionId) {
        const key = await this.resolveIdentifier(context, handle.configuration, executionId);
        await this.storage.deleteCredentialData(credentialId, key, handle.resolverId, handle.configuration);
    }
    async deleteAllSecrets(handle) {
        await this.storage.deleteAllCredentialData(handle);
    }
    async validateOptions(configuration) {
        return await this.n8nIdentifier.validateOptions(configuration);
    }
    async resolveIdentifier(context, configuration, executionId) {
        return await this.n8nIdentifier.resolve(context, configuration, executionId);
    }
    async resolveOwningUserId(context, handle, executionId) {
        return await this.resolveIdentifier(context, handle.configuration, executionId);
    }
    async validateIdentity(context, handle, executionId) {
        await this.resolveIdentifier(context, handle.configuration, executionId);
    }
};
exports.N8NCredentialResolver = N8NCredentialResolver;
exports.N8NCredentialResolver = N8NCredentialResolver = __decorate([
    (0, decorators_1.CredentialResolver)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_identifier_1.N8NIdentifier, dynamic_credential_user_entry_storage_1.DynamicCredentialUserEntryStorage, n8n_core_1.Cipher])
], N8NCredentialResolver);
//# sourceMappingURL=n8n-credential-resolver.js.map