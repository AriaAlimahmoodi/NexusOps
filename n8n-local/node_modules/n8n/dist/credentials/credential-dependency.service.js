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
exports.CredentialDependencyService = exports.EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const external_secrets_utils_1 = require("./external-secrets.utils");
var db_2 = require("@n8n/db");
Object.defineProperty(exports, "EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE", { enumerable: true, get: function () { return db_2.EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE; } });
let CredentialDependencyService = class CredentialDependencyService {
    constructor(credentialDependencyRepository, secretsProviderConnectionRepository) {
        this.credentialDependencyRepository = credentialDependencyRepository;
        this.secretsProviderConnectionRepository = secretsProviderConnectionRepository;
    }
    async resolveExternalSecretsStoreDependencyFilter(externalSecretsStoreProviderKey) {
        const providerId = await this.secretsProviderConnectionRepository.findIdByProviderKey(externalSecretsStoreProviderKey);
        if (providerId === null)
            return undefined;
        return {
            dependencyType: db_1.EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE,
            dependencyId: providerId,
        };
    }
    async resolveProviderIdsFromCredentialData(decryptedCredentialData, entityManager) {
        const providerKeys = [...(0, external_secrets_utils_1.extractProviderKeysFromCredentialData)(decryptedCredentialData)];
        return await this.secretsProviderConnectionRepository.findIdsByProviderKeys(providerKeys, entityManager);
    }
    async upsertExternalSecretProviderDependenciesForCredential({ credentialId, decryptedCredentialData, entityManager, }) {
        const dependencyIds = await this.resolveProviderIdsFromCredentialData(decryptedCredentialData, entityManager);
        await this.credentialDependencyRepository.upsertDependenciesForCredential({
            credentialId,
            dependencyType: db_1.EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE,
            dependencyIds,
            entityManager,
        });
    }
    async syncExternalSecretProviderDependenciesForCredential({ credentialId, decryptedCredentialData, entityManager, }) {
        const dependencyIds = await this.resolveProviderIdsFromCredentialData(decryptedCredentialData, entityManager);
        await this.credentialDependencyRepository.syncDependenciesForCredential({
            credentialId,
            dependencyType: db_1.EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE,
            dependencyIds,
            entityManager,
        });
    }
    async deleteDependencyById({ dependencyType, dependencyId, entityManager, }) {
        const manager = entityManager ?? this.credentialDependencyRepository.manager;
        await manager.delete(this.credentialDependencyRepository.target, {
            dependencyType,
            dependencyId,
        });
    }
    async deleteDependenciesByIds({ dependencyType, dependencyIds, entityManager, }) {
        if (dependencyIds.length === 0)
            return;
        const manager = entityManager ?? this.credentialDependencyRepository.manager;
        await manager.delete(this.credentialDependencyRepository.target, {
            dependencyType,
            dependencyId: (0, typeorm_1.In)(dependencyIds),
        });
    }
};
exports.CredentialDependencyService = CredentialDependencyService;
exports.CredentialDependencyService = CredentialDependencyService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.CredentialDependencyRepository, db_1.SecretsProviderConnectionRepository])
], CredentialDependencyService);
//# sourceMappingURL=credential-dependency.service.js.map