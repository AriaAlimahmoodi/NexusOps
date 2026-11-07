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
exports.CredentialOptionsService = void 0;
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const permissions_1 = require("@n8n/permissions");
const credential_types_1 = require("../credential-types");
const credentials_helper_1 = require("../credentials-helper");
const external_secrets_config_1 = require("../modules/external-secrets.ee/external-secrets.config");
const secret_provider_access_check_service_ee_1 = require("../modules/external-secrets.ee/secret-provider-access-check.service.ee");
const check_access_1 = require("../permissions.ee/check-access");
const workflow_execute_additional_data_1 = require("../workflow-execute-additional-data");
const credentials_service_1 = require("./credentials.service");
const validation_1 = require("./validation");
let CredentialOptionsService = class CredentialOptionsService {
    constructor(credentialTypes, credentialsHelper, credentialsService, credentialsFinder, externalSecretsConfig, secretProviderAccess) {
        this.credentialTypes = credentialTypes;
        this.credentialsHelper = credentialsHelper;
        this.credentialsService = credentialsService;
        this.credentialsFinder = credentialsFinder;
        this.externalSecretsConfig = externalSecretsConfig;
        this.secretProviderAccess = secretProviderAccess;
    }
    async lookupDraft(user, request, projectId) {
        const allowed = projectId === null
            ? (0, permissions_1.hasGlobalScope)(user, 'credential:manageInstance')
            : await (0, check_access_1.userHasScopes)(user, ['credential:create'], false, { projectId });
        if (!allowed)
            throw new errors_1.ForbiddenError();
        await this.credentialsService.enforceCredentialUse({ id: '', type: request.type }, { kind: 'user', user }, projectId);
        await this.validateExternalSecrets(user, request.data, projectId);
        return await this.load(user, request, request.data, projectId);
    }
    async lookupStored(user, credentialId, request) {
        const storedCredential = await this.credentialsFinder.findCredentialForUser(credentialId, user, ['credential:read'], { includeInstanceCredentials: true });
        if (!storedCredential)
            throw new errors_1.ForbiddenError();
        if (storedCredential.type !== request.type) {
            throw new errors_1.BadRequestError('The credential type does not match the stored credential');
        }
        const { credentials, storedData } = await this.credentialsService.prepareCredentialsForUse({
            storedCredential,
            user,
            credentialsToUse: storedCredential.isManaged
                ? undefined
                : { id: credentialId, name: storedCredential.name, type: request.type, data: request.data },
        });
        const projectId = credentials.homeProject?.id ?? null;
        const data = credentials.data ?? {};
        await this.validateExternalSecrets(user, data, projectId, storedData);
        return await this.load(user, request, data, projectId);
    }
    async validateExternalSecrets(user, data, projectId, storedData) {
        if (projectId === null) {
            this.credentialsService.validateInstanceCredentialData(data);
            return;
        }
        await (0, validation_1.validateExternalSecretsPermissions)({
            user,
            projectId,
            dataToSave: data,
            decryptedExistingData: storedData,
        });
        if (this.externalSecretsConfig.externalSecretsForProjects) {
            await (0, validation_1.validateAccessToReferencedSecretProviders)(projectId, data, this.secretProviderAccess, 'create');
        }
    }
    async load(user, request, data, projectId) {
        const credentialType = this.credentialTypes.getByName(request.type);
        const property = this.credentialsHelper
            .getCredentialsProperties(request.type)
            .find((field) => field.name === request.propertyName);
        const methodName = property?.typeOptions?.loadOptionsMethod;
        const loader = methodName && Object.hasOwn(credentialType.methods?.loadOptions ?? {}, methodName)
            ? credentialType.methods?.loadOptions?.[methodName]
            : undefined;
        if (property?.type !== 'options' || !loader) {
            throw new errors_1.BadRequestError('This credential field does not support loading a list.');
        }
        try {
            const additionalData = await (0, workflow_execute_additional_data_1.getBase)({ userId: user.id, projectId: projectId ?? undefined });
            const resolvedData = await this.credentialsHelper.applyDefaultsAndOverwrites(additionalData, data, request.type, 'internal', undefined, undefined);
            return await loader(resolvedData, request.filter, request.paginationToken);
        }
        catch {
            throw new errors_1.BadRequestError('Could not load the list. Try again or enter an ID.');
        }
    }
};
exports.CredentialOptionsService = CredentialOptionsService;
exports.CredentialOptionsService = CredentialOptionsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credential_types_1.CredentialTypes, credentials_helper_1.CredentialsHelper, credentials_service_1.CredentialsService, backend_services_1.CredentialsFinderService, external_secrets_config_1.ExternalSecretsConfig, secret_provider_access_check_service_ee_1.SecretsProviderAccessCheckService])
], CredentialOptionsService);
//# sourceMappingURL=credential-options.service.js.map