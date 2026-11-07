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
exports.EnterpriseCredentialsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const errors_1 = require("@n8n/errors");
const transfer_credential_error_1 = require("../errors/response-errors/transfer-credential.error");
const external_secrets_config_1 = require("../modules/external-secrets.ee/external-secrets.config");
const secret_provider_access_check_service_ee_1 = require("../modules/external-secrets.ee/secret-provider-access-check.service.ee");
const policy_enforcement_service_1 = require("../policy/policy-enforcement.service");
const ownership_service_1 = require("../services/ownership.service");
const project_service_ee_1 = require("../services/project.service.ee");
const backend_services_1 = require("@n8n/backend-services");
const credential_connection_status_proxy_1 = require("./credential-connection-status-proxy");
const credentials_service_1 = require("./credentials.service");
const validation_1 = require("./validation");
let EnterpriseCredentialsService = class EnterpriseCredentialsService {
    constructor(sharedCredentialsRepository, ownershipService, credentialsService, projectService, credentialsFinderService, roleService, externalSecretsConfig, externalSecretsProviderAccessCheckService, licenseState, connectionStatusProxy, policyEnforcementService) {
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.ownershipService = ownershipService;
        this.credentialsService = credentialsService;
        this.projectService = projectService;
        this.credentialsFinderService = credentialsFinderService;
        this.roleService = roleService;
        this.externalSecretsConfig = externalSecretsConfig;
        this.externalSecretsProviderAccessCheckService = externalSecretsProviderAccessCheckService;
        this.licenseState = licenseState;
        this.connectionStatusProxy = connectionStatusProxy;
        this.policyEnforcementService = policyEnforcementService;
    }
    async shareWithProjects(user, credentialId, shareWithIds, entityManager) {
        const em = entityManager ?? this.sharedCredentialsRepository.manager;
        const canShare = await em.exists(db_1.CredentialsEntity, {
            where: { id: credentialId, usageScope: 'project' },
        });
        if (!canShare)
            throw new errors_1.NotFoundError('Credential not found');
        const roles = await this.roleService.rolesWithScope('project', ['project:list']);
        let projects = await em.find(db_1.Project, {
            where: [
                {
                    id: (0, typeorm_1.In)(shareWithIds),
                    type: 'team',
                    ...((0, permissions_1.hasGlobalScope)(user, 'project:list')
                        ? {}
                        : {
                            projectRelations: {
                                userId: user.id,
                                role: (0, typeorm_1.In)(roles),
                            },
                        }),
                },
                {
                    id: (0, typeorm_1.In)(shareWithIds),
                    type: 'personal',
                },
            ],
            relations: { sharedCredentials: true },
        });
        projects = projects.filter((p) => !p.sharedCredentials.some((psc) => psc.credentialsId === credentialId && psc.role === 'credential:owner'));
        const newSharedCredentials = projects.map((project) => this.sharedCredentialsRepository.create({
            credentialsId: credentialId,
            role: 'credential:user',
            projectId: project.id,
        }));
        return await em.save(newSharedCredentials);
    }
    async getOne(credentialId) {
        return await this.credentialsFinderService.findById(credentialId);
    }
    async getOneForUser(user, credentialId, includeDecryptedData) {
        let credential = null;
        let decryptedData = null;
        credential = includeDecryptedData
            ?
                await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read', 'credential:update'], { includeInstanceCredentials: true })
            : null;
        if (credential) {
            decryptedData = await this.credentialsService.decrypt(credential);
        }
        else {
            credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read'], { includeInstanceCredentials: true, visibilityOnly: true });
            if (includeDecryptedData &&
                credential?.isResolvable &&
                (await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:connect'], { includeInstanceCredentials: true }))) {
                decryptedData = await this.credentialsService.decrypt(credential);
            }
        }
        if (!credential) {
            throw new errors_1.NotFoundError('Could not load the credential. If you think this is an error, ask the owner to share it with you again');
        }
        credential = this.ownershipService.addOwnedByAndSharedWith(credential);
        const { data: _, ...rest } = credential;
        const enriched = rest;
        await this.credentialsService.populateConnectedByMe([enriched], user);
        if (credential.isResolvable) {
            enriched.connectedUserCount = await this.credentialsService.countConnectedUsers(credential.id);
        }
        if (decryptedData) {
            if (credential.isResolvable) {
                if (enriched.connectedByMe) {
                    decryptedData.oauthTokenData = true;
                }
                else {
                    delete decryptedData.oauthTokenData;
                }
            }
            else if (decryptedData?.oauthTokenData) {
                decryptedData.oauthTokenData = true;
            }
            return { data: decryptedData, ...enriched };
        }
        return { ...enriched };
    }
    async transferOne(user, credentialId, destinationProjectId) {
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:move']);
        errors_1.NotFoundError.isDefinedAndNotNull(credential, `Could not find the credential with the id "${credentialId}". Make sure you have the permission to move it.`);
        const ownerSharing = credential.shared.find((s) => s.role === 'credential:owner');
        errors_1.NotFoundError.isDefinedAndNotNull(ownerSharing, `Could not find owner for credential "${credential.id}"`);
        const sourceProject = ownerSharing.project;
        const destinationProject = await this.projectService.getProjectWithScope(user, destinationProjectId, ['credential:create']);
        errors_1.NotFoundError.isDefinedAndNotNull(destinationProject, `Could not find project with the id "${destinationProjectId}". Make sure you have the permission to create credentials in it.`);
        if (sourceProject.id === destinationProject.id) {
            throw new transfer_credential_error_1.TransferCredentialError("You can't transfer a credential into the project that's already owning it.");
        }
        if (credential.isResolvable) {
            this.credentialsService.ensureEndUserCredentialAllowedInProject(destinationProject);
            await this.credentialsService.ensureCanManageEndUserCredential(user, destinationProject.id);
        }
        await this.policyEnforcementService.enforceCredentialTransfer({
            credential: { id: credential.id, type: credential.type },
            targetProjectId: destinationProject.id,
        }, { kind: 'user', user });
        if (this.licenseState.isExternalSecretsLicensed() &&
            this.externalSecretsConfig.externalSecretsForProjects) {
            const decryptedData = await this.credentialsService.decrypt(credential, true);
            await (0, validation_1.validateAccessToReferencedSecretProviders)(destinationProject.id, decryptedData, this.externalSecretsProviderAccessCheckService, 'transfer');
        }
        const affectedProjectIds = [...new Set(credential.shared.map((s) => s.projectId))];
        await this.sharedCredentialsRepository.manager.transaction(async (trx) => {
            await trx.remove(credential.shared);
            await trx.save(trx.create(db_1.SharedCredentials, {
                credentialsId: credential.id,
                projectId: destinationProject.id,
                role: 'credential:owner',
            }));
            await this.connectionStatusProxy.cleanupOrphanedEntriesForProjects(credential.id, affectedProjectIds, trx);
        });
    }
};
exports.EnterpriseCredentialsService = EnterpriseCredentialsService;
exports.EnterpriseCredentialsService = EnterpriseCredentialsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SharedCredentialsRepository, ownership_service_1.OwnershipService, credentials_service_1.CredentialsService, project_service_ee_1.ProjectService, backend_services_1.CredentialsFinderService, backend_services_1.RoleService, external_secrets_config_1.ExternalSecretsConfig, secret_provider_access_check_service_ee_1.SecretsProviderAccessCheckService, backend_common_1.LicenseState, credential_connection_status_proxy_1.CredentialConnectionStatusProxy, policy_enforcement_service_1.PolicyEnforcementService])
], EnterpriseCredentialsService);
//# sourceMappingURL=credentials.service.ee.js.map