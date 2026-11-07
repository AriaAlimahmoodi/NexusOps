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
exports.CredentialsService = exports.PENDING_AUTHORIZATION_GRACE_MS = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const credential_sharing_1 = require("../constants/credential-sharing");
const credential_types_1 = require("../credential-types");
const credentials_helper_1 = require("../credentials-helper");
const credential_not_found_error_1 = require("../errors/credential-not-found.error");
const errors_1 = require("@n8n/errors");
const external_hooks_1 = require("../external-hooks");
const generic_helpers_1 = require("../generic-helpers");
const shared_fields_1 = require("../modules/dynamic-credentials.ee/services/shared-fields");
const external_secrets_config_1 = require("../modules/external-secrets.ee/external-secrets.config");
const secret_provider_access_check_service_ee_1 = require("../modules/external-secrets.ee/secret-provider-access-check.service.ee");
const dcr_managed_fields_1 = require("../oauth/dcr-managed-fields");
const validate_oauth_url_1 = require("../oauth/validate-oauth-url");
const check_access_1 = require("../permissions.ee/check-access");
const policy_enforcement_service_1 = require("../policy/policy-enforcement.service");
const credentials_tester_service_1 = require("../services/credentials-tester.service");
const ownership_service_1 = require("../services/ownership.service");
const project_service_ee_1 = require("../services/project.service.ee");
const credential_connection_status_proxy_1 = require("./credential-connection-status-proxy");
const credential_descriptions_service_1 = require("./credential-descriptions.service");
const credential_dependency_service_1 = require("./credential-dependency.service");
const external_secrets_utils_1 = require("./external-secrets.utils");
const instance_credential_use_registry_1 = require("./instance-credential-use.registry");
const validation_1 = require("./validation");
const CUSTOM_AUTH_JSON_REDACTED_VALUE = '***';
const CLIENT_CREDENTIALS_GRANT_TYPE = 'clientCredentials';
const CLIENT_CREDENTIALS_TOKEN_FIELDS = [
    'grantType',
    'clientId',
    'clientCredentialType',
    'clientSecret',
    'privateKey',
    'certificate',
    'accessTokenUrl',
    'scope',
    'additionalBodyProperties',
];
function comparableCredentialField(value) {
    if (value === undefined || value === null)
        return '';
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
function parseHttpUrl(value) {
    if (typeof value !== 'string')
        return undefined;
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
    }
    catch {
        return undefined;
    }
}
exports.PENDING_AUTHORIZATION_GRACE_MS = 1 * constants_1.Time.hours.toMilliseconds;
function resolveSharedRoute(isProjectRoute) {
    return isProjectRoute ? 'project' : 'personal';
}
function parseAcceptedStatusCodes(raw) {
    if (typeof raw !== 'string' || raw.trim() === '')
        return undefined;
    const parsed = (0, n8n_workflow_1.jsonParse)(raw, { fallbackValue: null });
    if (!Array.isArray(parsed))
        return undefined;
    const codes = parsed.filter((code) => Number.isInteger(code));
    return codes.length > 0 ? codes : undefined;
}
let CredentialsService = class CredentialsService {
    constructor(credentialsRepository, credentialDependencyService, sharedCredentialsRepository, ownershipService, logger, errorReporter, credentialsTester, externalHooks, credentialTypes, projectRepository, projectService, roleService, userRepository, credentialsFinderService, credentialsHelper, externalSecretsConfig, externalSecretsProviderAccessCheckService, connectionStatusProxy, instanceCredentialAssignmentRepository, instanceCredentialUseRegistry, dbLockService, eventService, transactionRunner, policyEnforcementService, credentialDescriptions) {
        this.credentialsRepository = credentialsRepository;
        this.credentialDependencyService = credentialDependencyService;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.ownershipService = ownershipService;
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.credentialsTester = credentialsTester;
        this.externalHooks = externalHooks;
        this.credentialTypes = credentialTypes;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.roleService = roleService;
        this.userRepository = userRepository;
        this.credentialsFinderService = credentialsFinderService;
        this.credentialsHelper = credentialsHelper;
        this.externalSecretsConfig = externalSecretsConfig;
        this.externalSecretsProviderAccessCheckService = externalSecretsProviderAccessCheckService;
        this.connectionStatusProxy = connectionStatusProxy;
        this.instanceCredentialAssignmentRepository = instanceCredentialAssignmentRepository;
        this.instanceCredentialUseRegistry = instanceCredentialUseRegistry;
        this.dbLockService = dbLockService;
        this.eventService = eventService;
        this.transactionRunner = transactionRunner;
        this.policyEnforcementService = policyEnforcementService;
        this.credentialDescriptions = credentialDescriptions;
    }
    async countConnectedUsers(credentialId) {
        return await this.connectionStatusProxy.countConnectedUsers(credentialId);
    }
    async populateConnectedByMe(credentials, user) {
        const resolvable = credentials.filter((c) => c.isResolvable === true);
        if (resolvable.length === 0)
            return;
        const connections = await this.connectionStatusProxy.findMyConnections(user.id, resolvable.map((c) => c.id));
        for (const c of resolvable) {
            const connection = connections.get(c.id);
            const enriched = c;
            enriched.connectedByMe = connection !== undefined;
            enriched.connectedAccountIdentifier = connection?.accountIdentifier;
        }
    }
    async getMany(user, options = {}) {
        const { credentials } = await this.getManyAndCount(user, options);
        return credentials;
    }
    async getManyAndCount(user, { listQueryOptions = {}, includeScopes = false, includeData = false, onlySharedWithMe = false, includeGlobal = false, filters = {}, } = {}) {
        if (listQueryOptions.select?.description && !(await this.credentialDescriptions.isEnabled())) {
            delete listQueryOptions.select.description;
            if (Object.keys(listQueryOptions.select).length === 0)
                delete listQueryOptions.select;
        }
        const { externalSecretsStore } = filters;
        const returnAll = (0, permissions_1.hasGlobalScope)(user, 'credential:list');
        const isDefaultSelect = !listQueryOptions.select;
        const dependencyFilter = externalSecretsStore
            ? await this.credentialDependencyService.resolveExternalSecretsStoreDependencyFilter(externalSecretsStore)
            : undefined;
        if (externalSecretsStore && !dependencyFilter) {
            return { credentials: [], count: 0 };
        }
        if (includeData) {
            includeScopes = true;
        }
        const fetchOptions = {
            listQueryOptions,
            includeGlobal,
            includeData,
            onlySharedWithMe,
            filters: { dependency: dependencyFilter },
        };
        const { credentials, count } = returnAll
            ? await this.getManyForAdminUser(user, fetchOptions)
            : await this.getManyForMemberUser(user, fetchOptions);
        const enriched = await this.enrichCredentials(credentials, user, isDefaultSelect, includeScopes, includeData, listQueryOptions, onlySharedWithMe);
        return { credentials: enriched, count };
    }
    async getManyForAdminUser(user, { listQueryOptions, includeGlobal, includeData, onlySharedWithMe, filters, }) {
        const { dependency: dependencyFilter } = filters ?? {};
        if (onlySharedWithMe || dependencyFilter) {
            const sharingOptions = {
                ...(onlySharedWithMe ? { onlySharedWithMe: true } : {}),
            };
            return await this.credentialsRepository.getManyAndCountWithSharingSubquery(user, sharingOptions, {
                ...listQueryOptions,
                ...(includeData ? { includeData: true } : {}),
                ...(includeGlobal ? { includeGlobal: true } : {}),
                filters: {
                    dependency: dependencyFilter,
                },
            });
        }
        await this.applyPersonalProjectFilter(listQueryOptions);
        const [credentials, count] = await this.credentialsRepository.findManyAndCount({
            ...listQueryOptions,
            ...(includeData ? { includeData: true } : {}),
            ...(includeGlobal ? { includeGlobal: true } : {}),
        });
        return { credentials, count };
    }
    async getManyForMemberUser(user, { listQueryOptions, includeGlobal, includeData, onlySharedWithMe, filters, }) {
        const { dependency: dependencyFilter } = filters ?? {};
        let isPersonalProject = false;
        let personalProjectOwnerId = null;
        if (listQueryOptions.filter?.projectId) {
            const project = await this.projectRepository.findOneBy({
                id: listQueryOptions.filter.projectId,
            });
            if (!project) {
                return { credentials: [], count: 0 };
            }
            isPersonalProject = project.type === 'personal';
            personalProjectOwnerId = project.creatorId;
        }
        const sharingOptions = {};
        if (isPersonalProject && personalProjectOwnerId) {
            if (personalProjectOwnerId !== user.id && !(0, permissions_1.hasGlobalScope)(user, 'credential:read')) {
                return { credentials: [], count: 0 };
            }
            sharingOptions.isPersonalProject = true;
            sharingOptions.personalProjectOwnerId = personalProjectOwnerId;
        }
        else if (onlySharedWithMe) {
            sharingOptions.onlySharedWithMe = true;
        }
        else {
            const projectRoles = await this.roleService.rolesWithScope('project', ['credential:read']);
            const credentialRoles = await this.roleService.rolesWithScope('credential', [
                'credential:read',
            ]);
            sharingOptions.scopes = ['credential:read'];
            sharingOptions.projectRoles = projectRoles;
            sharingOptions.credentialRoles = credentialRoles;
        }
        return await this.credentialsRepository.getManyAndCountWithSharingSubquery(user, sharingOptions, {
            ...listQueryOptions,
            ...(includeData ? { includeData: true } : {}),
            ...(includeGlobal ? { includeGlobal: true } : {}),
            filters: {
                dependency: dependencyFilter,
            },
        });
    }
    async applyPersonalProjectFilter(listQueryOptions) {
        const projectId = typeof listQueryOptions.filter?.projectId === 'string'
            ? listQueryOptions.filter.projectId
            : undefined;
        if (!projectId) {
            return;
        }
        let project;
        try {
            project = await this.projectService.getProject(projectId);
        }
        catch { }
        if (project?.type === 'personal') {
            listQueryOptions.filter = {
                ...listQueryOptions.filter,
                withRole: 'credential:owner',
            };
        }
    }
    async enrichCredentials(credentials, user, isDefaultSelect, includeScopes, includeData, listQueryOptions, onlySharedWithMe) {
        await this.credentialDescriptions.stripIfDisabled(credentials);
        if (isDefaultSelect) {
            credentials = await this.populateSharedRelations(credentials, listQueryOptions, onlySharedWithMe);
        }
        if (includeScopes) {
            credentials = await this.addScopesToCredentials(credentials, user);
        }
        if (includeData) {
            const decrypted = await this.addDecryptedDataToCredentials(credentials);
            await this.populateConnectedByMe(decrypted, user);
            return decrypted;
        }
        await this.populateConnectedByMe(credentials, user);
        return credentials;
    }
    async populateSharedRelations(credentials, listQueryOptions, onlySharedWithMe) {
        const needsRelations = listQueryOptions.filter?.shared &&
            typeof listQueryOptions.filter.shared === 'object' &&
            'projectId' in listQueryOptions.filter.shared
            ? listQueryOptions.filter.shared.projectId
            : onlySharedWithMe;
        if (needsRelations) {
            const relations = await this.sharedCredentialsRepository.getAllRelationsForCredentials(credentials.map((c) => c.id));
            credentials.forEach((c) => {
                c.shared = relations.filter((r) => r.credentialsId === c.id);
            });
        }
        return credentials.map((c) => this.ownershipService.addOwnedByAndSharedWith(c));
    }
    async addScopesToCredentials(credentials, user) {
        const projectRelations = await this.projectService.getProjectRelationsForUser(user);
        return credentials.map((c) => this.roleService.addScopes(c, user, projectRelations));
    }
    async addDecryptedDataToCredentials(credentials) {
        return await Promise.all(credentials.map(async (c) => {
            const data = c.scopes.includes('credential:update') ? await this.decrypt(c) : undefined;
            if (data?.oauthTokenData) {
                data.oauthTokenData = true;
            }
            return {
                ...c,
                data,
            };
        }));
    }
    async getCredentialsAUserCanUseInAWorkflow(user, options) {
        const projectRelations = await this.projectService.getProjectRelationsForUser(user);
        const allCredentials = await this.credentialsFinderService.findCredentialsForUser(user, [
            'credential:read',
        ]);
        const credentialIdsForWorkflow = new Set('workflowId' in options
            ? (await this.findAllCredentialIdsForWorkflow(options.workflowId)).map((c) => c.id)
            : (await this.findAllCredentialIdsForProject(options.projectId)).map((c) => c.id));
        const personalRouteCredentialIds = (0, credential_sharing_1.isCredSharingEnabled)() && !options.excludePersonalRoute
            ? await this.findPersonalRouteCredentialIds(user, allCredentials, projectRelations, options)
            : new Set();
        const usableCredentials = allCredentials.filter((c) => credentialIdsForWorkflow.has(c.id) || personalRouteCredentialIds.has(c.id) || c.isGlobal);
        if (usableCredentials.length > 0) {
            const relations = await this.sharedCredentialsRepository.getAllRelationsForCredentials(usableCredentials.map((c) => c.id));
            const relationsByCredentialId = new Map();
            for (const relation of relations) {
                const credentialRelations = relationsByCredentialId.get(relation.credentialsId);
                if (credentialRelations)
                    credentialRelations.push(relation);
                else
                    relationsByCredentialId.set(relation.credentialsId, [relation]);
            }
            usableCredentials.forEach((c) => {
                c.shared = relationsByCredentialId.get(c.id) ?? [];
            });
        }
        const enriched = usableCredentials
            .map((c) => this.ownershipService.addOwnedByAndSharedWith(c))
            .map((c) => this.roleService.addScopes(c, user, projectRelations));
        const descriptionsEnabled = await this.credentialDescriptions.isEnabled();
        const result = enriched.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            ...(descriptionsEnabled && { description: c.description }),
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            scopes: c.scopes,
            isManaged: c.isManaged,
            isGlobal: c.isGlobal,
            isResolvable: c.isResolvable,
            homeProject: c.homeProject,
            sharedWithProjects: c.sharedWithProjects,
            currentUserHasAccess: true,
            sharedRoute: resolveSharedRoute(credentialIdsForWorkflow.has(c.id) || c.isGlobal),
        }));
        await this.populateConnectedByMe(result, user);
        return result;
    }
    async findPersonalRouteCredentialIds(user, candidateCredentials, userProjectRelations, options) {
        const personalProject = await this.projectService.getPersonalProject(user);
        if (!personalProject)
            return new Set();
        const personalGrantCredentialIds = new Set(candidateCredentials
            .filter((c) => c.shared.some((s) => s.projectId === personalProject.id))
            .map((c) => c.id));
        if (personalGrantCredentialIds.size === 0)
            return personalGrantCredentialIds;
        const targetProjectIds = 'workflowId' in options
            ? await this.projectService.findProjectsWorkflowIsIn(options.workflowId)
            : [options.projectId];
        const userIsMemberOfTargetProject = userProjectRelations.some((relation) => targetProjectIds.includes(relation.projectId));
        return userIsMemberOfTargetProject ? personalGrantCredentialIds : new Set();
    }
    async findAllGlobalCredentialIds(includeData = false) {
        const globalCredentials = await this.credentialsRepository.findAllGlobalCredentials({
            includeData,
        });
        return globalCredentials;
    }
    async findAllCredentialIdsForWorkflow(workflowId) {
        const user = await this.userRepository.findPersonalOwnerForWorkflow(workflowId);
        if (user && (0, permissions_1.hasGlobalScope)(user, 'credential:use')) {
            return await this.credentialsRepository.findAllPersonalCredentials();
        }
        return await this.credentialsRepository.findAllCredentialsForWorkflow(workflowId);
    }
    async findAllCredentialIdsForProject(projectId) {
        const user = await this.userRepository.findPersonalOwnerForProject(projectId);
        if (user && (0, permissions_1.hasGlobalScope)(user, 'credential:use')) {
            return await this.credentialsRepository.findAllPersonalCredentials();
        }
        return await this.credentialsRepository.findAllCredentialsForProject(projectId);
    }
    async getSharing(user, credentialId, globalScopes, relations = { credentials: true }) {
        let where = {
            credentialsId: credentialId,
            credentials: { usageScope: 'project' },
        };
        if (!(0, permissions_1.hasGlobalScope)(user, globalScopes, { mode: 'allOf' })) {
            where = {
                ...where,
                role: 'credential:owner',
                project: {
                    projectRelations: {
                        role: { slug: permissions_1.PROJECT_OWNER_ROLE_SLUG },
                        userId: user.id,
                    },
                },
            };
        }
        return await this.sharedCredentialsRepository.findOne({
            where,
            relations,
        });
    }
    applyDataMerge(incomingData, decryptedData, credentialType, dataMerge) {
        if (dataMerge === 'replace') {
            return incomingData;
        }
        const dataToUnredact = dataMerge === 'partial' ? { ...decryptedData, ...incomingData } : incomingData;
        return this.unredact(dataToUnredact, decryptedData, this.getCredentialTypeProperties(credentialType));
    }
    async prepareUpdateData(user, data, existingCredential, options) {
        const decryptedData = await this.decrypt(existingCredential, true);
        const dataMerge = options?.dataMerge ?? 'unredact';
        const mergedData = (0, n8n_workflow_1.deepCopy)(data);
        await this.credentialDescriptions.stripIfDisabled(mergedData);
        if (mergedData.description !== undefined) {
            mergedData.description = (0, validation_1.parseCredentialDescription)(mergedData.description);
        }
        if (mergedData.data) {
            mergedData.data = this.applyDataMerge(mergedData.data, decryptedData, existingCredential.type, dataMerge);
        }
        if (existingCredential.usageScope === 'instance') {
            await this.validateInstanceCredentialUpdate(existingCredential, mergedData.data ?? decryptedData, undefined, options?.operationContext);
        }
        else {
            const projectOwningCredential = existingCredential.shared?.find((shared) => shared.role === 'credential:owner');
            if (!projectOwningCredential) {
                throw new errors_1.NotFoundError(`Could not find owner for credential "${existingCredential.id}"`);
            }
            await (0, validation_1.validateExternalSecretsPermissions)({
                user,
                projectId: projectOwningCredential.projectId,
                dataToSave: data.data,
                decryptedExistingData: decryptedData,
            });
            if (this.externalSecretsConfig.externalSecretsForProjects && data.data) {
                await (0, validation_1.validateAccessToReferencedSecretProviders)(projectOwningCredential.projectId, data.data, this.externalSecretsProviderAccessCheckService, 'update');
            }
        }
        const updateData = this.credentialsRepository.create(mergedData);
        await (0, generic_helpers_1.validateEntity)(updateData);
        if (dataMerge !== 'replace' && !options?.clearOauthTokenData) {
            this.restoreHiddenDcrFields(existingCredential.type, updateData.data, decryptedData);
            if (decryptedData.oauthTokenData &&
                !this.reissuesClientCredentialsToken(updateData.data, decryptedData)) {
                updateData.data.oauthTokenData = decryptedData.oauthTokenData;
            }
        }
        if (updateData.data) {
            this.validateOAuthCredentialUrls(updateData.type, updateData.data);
        }
        return updateData;
    }
    reissuesClientCredentialsToken(dataToSave, storedData) {
        if (dataToSave.grantType !== CLIENT_CREDENTIALS_GRANT_TYPE &&
            storedData.grantType !== CLIENT_CREDENTIALS_GRANT_TYPE) {
            return false;
        }
        return CLIENT_CREDENTIALS_TOKEN_FIELDS.some((field) => comparableCredentialField(dataToSave[field]) !==
            comparableCredentialField(storedData[field]));
    }
    restoreHiddenDcrFields(credentialType, dataToSave, storedData) {
        let properties;
        try {
            properties = this.credentialsHelper.getCredentialsProperties(credentialType);
        }
        catch {
            return;
        }
        if (!properties?.length)
            return;
        const storedWithDefaults = n8n_workflow_1.NodeHelpers.getNodeParameters(properties, storedData, true, true, null, null) ?? {};
        for (const field of dcr_managed_fields_1.DCR_MANAGED_CREDENTIAL_FIELDS) {
            if (field in dataToSave || !(field in storedData))
                continue;
            const property = properties.find((candidate) => candidate.name === field);
            if (property && (0, n8n_workflow_1.displayParameter)(storedWithDefaults, property, null, null))
                continue;
            dataToSave[field] = storedData[field];
        }
    }
    async createEncryptedData(credential) {
        const credentials = new n8n_core_1.Credentials({ id: credential.id, name: credential.name }, credential.type);
        await credentials.setData(credential.data);
        const newCredentialData = credentials.getDataToSave();
        newCredentialData.updatedAt = new Date();
        return newCredentialData;
    }
    async clearOauthTokenData(credential, actor) {
        const decryptedData = await (0, credentials_helper_1.createCredentialsFromCredentialsEntity)(credential).getData();
        delete decryptedData.oauthTokenData;
        delete decryptedData.accountIdentifier;
        const newCredentialData = await this.createEncryptedData({
            id: credential.id,
            name: credential.name,
            type: credential.type,
            data: decryptedData,
        });
        await this.update(credential.id, newCredentialData, actor, decryptedData);
    }
    async decryptForUse(credential, actor, projectId) {
        const judgedProjectId = projectId === undefined
            ? ((await this.findCredentialOwningProject(credential.id))?.id ?? null)
            : projectId;
        await this.enforceCredentialUse(credential, actor, judgedProjectId);
        return await this.decrypt(credential, true);
    }
    async enforceCredentialUse(credential, actor, projectId) {
        await this.policyEnforcementService.enforceCredentialDecrypt({ credentialType: credential.type, credentialId: credential.id, consumer: null, projectId }, actor);
    }
    async decrypt(credential, includeRawData = false) {
        const coreCredential = (0, credentials_helper_1.createCredentialsFromCredentialsEntity)(credential);
        try {
            const data = await coreCredential.getData();
            if (includeRawData) {
                return data;
            }
            return this.redact(data, credential);
        }
        catch (error) {
            if (error instanceof n8n_core_1.CredentialDataError) {
                this.errorReporter.error(error, {
                    level: 'error',
                    extra: { credentialId: credential.id },
                    tags: { credentialType: credential.type },
                });
                return {};
            }
            throw error;
        }
    }
    async update(credentialId, newCredentialData, actor, decryptedCredentialData, options) {
        await this.credentialDescriptions.stripIfDisabled(newCredentialData);
        await this.externalHooks.run('credentials.update', [newCredentialData]);
        await this.credentialDescriptions.stripIfDisabled(newCredentialData);
        const cleared = await this.enforceCredentialUpdate(credentialId, newCredentialData.type, actor);
        if (cleared === null)
            return null;
        const persist = async (transactionManager, ctx) => {
            await this.credentialsRepository.updateContent(credentialId, newCredentialData, ctx);
            if (options?.deleteUserEntries) {
                await this.connectionStatusProxy.deleteAllUserEntries(credentialId, transactionManager);
            }
            if (decryptedCredentialData) {
                await this.credentialDependencyService.syncExternalSecretProviderDependenciesForCredential({
                    credentialId,
                    decryptedCredentialData,
                    entityManager: transactionManager,
                });
            }
            return await transactionManager.findOneBy(db_1.CredentialsEntity, { id: credentialId });
        };
        let result;
        if (!options?.instanceCredential) {
            result = await this.credentialsRepository.runInTransaction({ policyCleared: cleared }, persist);
        }
        else {
            const instanceCredential = options.instanceCredential;
            const hookedData = await this.getValidatedInstanceCredentialHookData(newCredentialData, instanceCredential.id, instanceCredential.type);
            result = await this.dbLockService.withLock(1007, async (transactionManager, ctx) => {
                await this.validateInstanceCredentialUpdate(instanceCredential, hookedData, undefined, ctx);
                return await persist(transactionManager, { ...ctx, policyCleared: cleared });
            });
        }
        if (result)
            await this.credentialDescriptions.stripIfDisabled(result);
        const enriched = result;
        if (enriched && options?.user) {
            await this.populateConnectedByMe([enriched], options.user);
        }
        return enriched;
    }
    async runInstanceCredentialHooks(event, credential) {
        const encrypted = await this.createEncryptedData(credential);
        await this.externalHooks.run(`credentials.${event}`, [encrypted]);
        return encrypted;
    }
    async updateInstanceCredential(user, credentialId, data, ctx, options = {}) {
        if (!(0, permissions_1.hasGlobalScope)(user, 'credential:manageInstance')) {
            throw new errors_1.ForbiddenError('You do not have permission to update provider connections');
        }
        const credential = await this.credentialsRepository.findInstanceCredentialById(credentialId, ctx);
        if (!credential) {
            throw new errors_1.NotFoundError(`Credential with ID "${credentialId}" could not be found.`);
        }
        const prepared = await this.prepareUpdateData(user, data, credential, {
            operationContext: ctx,
        });
        if (prepared.type !== credential.type) {
            throw new errors_1.BadRequestError('Provider connection type cannot be changed. Create a new connection instead.');
        }
        const decryptedData = prepared.data;
        const encrypted = options.encryptedData ??
            (await this.createEncryptedData({
                id: credential.id,
                name: prepared.name,
                type: prepared.type,
                data: decryptedData,
            }));
        if (prepared.description !== undefined) {
            encrypted.description = prepared.description;
        }
        if (!options.skipExternalHooks) {
            await this.externalHooks.run('credentials.update', [encrypted]);
        }
        await this.credentialDescriptions.stripIfDisabled(encrypted);
        const hookedData = await this.getValidatedInstanceCredentialHookData(encrypted, credential.id, credential.type);
        await this.validateInstanceCredentialUpdate(credential, hookedData, undefined, ctx);
        const cleared = await this.policyEnforcementService.enforceCredentialSave({
            credential: { id: credential.id, type: credential.type },
            storedCredential: { id: credential.id, type: credential.type },
            projectId: null,
        }, { kind: 'user', user });
        const updated = await this.credentialsRepository.updateInstanceCredential(credential.id, encrypted, { ...ctx, policyCleared: cleared });
        if (!updated) {
            throw new errors_1.NotFoundError(`Credential with ID "${credentialId}" could not be found.`);
        }
        await this.credentialDescriptions.stripIfDisabled(updated);
        return updated;
    }
    async resolveOwningProjectIdForNewCredential(user, projectId, entityManager) {
        if (projectId !== undefined) {
            return projectId;
        }
        const personalProject = await this.projectRepository.getPersonalProjectForUserOrFail(user.id, entityManager);
        return personalProject.id;
    }
    async save(credential, encryptedData, user, projectId, decryptedCredentialData) {
        const newCredential = new db_1.CredentialsEntity();
        Object.assign(newCredential, credential, encryptedData);
        await this.credentialDescriptions.stripIfDisabled(encryptedData);
        await this.externalHooks.run('credentials.create', [encryptedData]);
        await this.credentialDescriptions.stripIfDisabled(newCredential);
        const project = await this.projectService.getProjectWithScope(user, projectId, [
            'credential:create',
        ]);
        if (project === null) {
            if (!(await this.projectRepository.existsBy({ id: projectId }))) {
                throw new errors_1.NotFoundError('Project not found');
            }
            throw new errors_1.ForbiddenError("You don't have the permissions to save the credential in this project.");
        }
        const cleared = await this.enforceCredentialCreate(newCredential.type, project.id, user);
        const result = await this.credentialsRepository.runInTransaction({ policyCleared: cleared }, async (transactionManager, ctx) => {
            const savedCredential = await this.credentialsRepository.createContent(newCredential, ctx);
            savedCredential.data = newCredential.data;
            const newSharedCredential = this.sharedCredentialsRepository.create({
                role: 'credential:owner',
                credentials: savedCredential,
                projectId: project.id,
            });
            await transactionManager.save(newSharedCredential);
            if (decryptedCredentialData) {
                await this.credentialDependencyService.upsertExternalSecretProviderDependenciesForCredential({
                    credentialId: savedCredential.id,
                    decryptedCredentialData,
                    entityManager: transactionManager,
                });
            }
            return savedCredential;
        });
        this.logger.debug('New credential created', {
            credentialId: newCredential.id,
            ownerId: user.id,
        });
        await this.credentialDescriptions.stripIfDisabled(result);
        return result;
    }
    async enforceCredentialUpdate(credentialId, newType, actor) {
        const stored = await this.credentialsRepository.findOneBy({ id: credentialId });
        if (!stored)
            return null;
        const owningProject = await this.sharedCredentialsRepository.findCredentialOwningProject(credentialId);
        return await this.policyEnforcementService.enforceCredentialSave({
            credential: { id: credentialId, type: newType ?? stored.type },
            storedCredential: { id: credentialId, type: stored.type },
            projectId: owningProject?.id ?? null,
        }, actor);
    }
    async enforceCredentialCreate(type, projectId, user) {
        return await this.policyEnforcementService.enforceCredentialSave({ credential: { id: null, type }, storedCredential: null, projectId }, { kind: 'user', user });
    }
    async insertProjectCredential(credential, encryptedData, user, projectId, decryptedCredentialData) {
        const newCredential = this.credentialsRepository.create({ ...credential, ...encryptedData });
        await this.credentialDescriptions.stripIfDisabled(encryptedData);
        await this.externalHooks.run('credentials.create', [encryptedData]);
        await this.credentialDescriptions.stripIfDisabled(newCredential);
        const externalSecretProviderIds = await this.credentialDependencyService.resolveProviderIdsFromCredentialData(decryptedCredentialData);
        const project = await this.projectService.getProjectWithScope(user, projectId, [
            'credential:create',
        ]);
        if (project === null) {
            if (!(await this.projectRepository.existsBy({ id: projectId }))) {
                throw new errors_1.NotFoundError('Project not found');
            }
            throw new errors_1.ForbiddenError("You don't have the permissions to save the credential in this project.");
        }
        const cleared = await this.enforceCredentialCreate(newCredential.type, project.id, user);
        const saved = await this.transactionRunner.run({ policyCleared: cleared }, async (ctx) => {
            return await this.credentialsRepository.insertProjectCredentialWithOwner(newCredential, project.id, externalSecretProviderIds, ctx);
        });
        await this.credentialDescriptions.stripIfDisabled(saved);
        return saved;
    }
    async findCredentialOwningProject(credentialId) {
        return await this.sharedCredentialsRepository.findCredentialOwningProject(credentialId);
    }
    async delete(user, credentialId, options = {}) {
        const credential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:delete'], options);
        if (!credential) {
            return false;
        }
        let owningProject;
        if (credential.isResolvable) {
            owningProject =
                await this.sharedCredentialsRepository.findCredentialOwningProject(credentialId);
            await this.ensureCanManageEndUserCredential(user, owningProject?.id);
        }
        else {
            try {
                owningProject =
                    await this.sharedCredentialsRepository.findCredentialOwningProject(credentialId);
            }
            catch (error) {
                this.logger.warn('Failed to resolve the project owning a credential', {
                    credentialId,
                    error,
                });
            }
        }
        await this.externalHooks.run('credentials.delete', [credentialId]);
        if (credential.usageScope === 'instance') {
            const result = await this.credentialsRepository.deleteInstanceCredentialIfUnassigned(credential.id);
            if (result.status === 'assigned') {
                throw new errors_1.BadRequestError(`This credential is assigned to credential use "${result.credentialUseIds.join(', ')}" and cannot be deleted`);
            }
            if (result.status === 'deleted') {
                this.emitCredentialDeleted(user, credential, owningProject?.id);
            }
            return result.status === 'deleted';
        }
        await this.credentialsRepository.remove(credential);
        this.emitCredentialDeleted(user, credential, owningProject?.id);
        return true;
    }
    async deleteUnowned(user, credentialId) {
        if (!(0, permissions_1.hasGlobalScope)(user, 'credential:delete')) {
            throw new errors_1.ForbiddenError('You do not have permission to delete credentials without an owner');
        }
        const credential = await this.credentialsRepository.findProjectCredentialWithoutOwner(credentialId);
        if (!credential)
            return;
        await this.externalHooks.run('credentials.delete', [credentialId]);
        await this.credentialsRepository.delete({ id: credential.id });
        this.emitCredentialDeleted(user, credential, undefined);
    }
    emitCredentialDeleted(user, credential, projectId) {
        this.eventService.emit('credentials-deleted', {
            user,
            credentialType: credential.type,
            credentialId: credential.id,
            credentialName: credential.name,
            projectId,
        });
        if (credential.isResolvable) {
            this.eventService.emit('private-credential-deleted', {
                user,
                credentialType: credential.type,
                credentialId: credential.id,
            });
        }
    }
    async test(userId, credentials) {
        return await this.credentialsTester.testCredentials(userId, credentials.type, credentials);
    }
    async testById(user, credentialId) {
        const storedCredential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
        if (!storedCredential || storedCredential.usageScope !== 'project') {
            throw new credential_not_found_error_1.CredentialNotFoundError(credentialId);
        }
        const { credentials } = await this.prepareCredentialsForUse({ storedCredential, user });
        return await this.test(user.id, credentials);
    }
    async testWithCredentials(user, credentials) {
        const storedCredential = await this.credentialsFinderService.findCredentialForUser(credentials.id, user, ['credential:read'], { includeInstanceCredentials: true });
        if (!storedCredential) {
            if (credentials.id === '' && (0, permissions_1.hasGlobalScope)(user, 'credential:manageInstance')) {
                this.validateInstanceCredentialData(credentials.data ?? {});
                await this.enforceCredentialUse(credentials, { kind: 'user', user }, null);
                return await this.test(user.id, credentials);
            }
            throw new credential_not_found_error_1.CredentialNotFoundError(credentials.id);
        }
        const { credentials: mergedCredentials } = await this.prepareCredentialsForUse({
            storedCredential,
            user,
            credentialsToUse: storedCredential.isManaged ? undefined : credentials,
        });
        return await this.test(user.id, mergedCredentials);
    }
    async probeById(user, credentialId) {
        const storedCredential = await this.credentialsFinderService.findCredentialForUser(credentialId, user, ['credential:read']);
        if (!storedCredential) {
            throw new credential_not_found_error_1.CredentialNotFoundError(credentialId);
        }
        const data = await this.decryptForUse(storedCredential, { kind: 'user', user });
        const testTarget = parseHttpUrl(data.testUrl);
        if (!testTarget) {
            throw new errors_1.BadRequestError('The credential has no test URL to probe');
        }
        const storedOrigin = typeof data.serviceOrigin === 'string' ? data.serviceOrigin.trim() : '';
        const serviceOrigin = parseHttpUrl(storedOrigin);
        if (!serviceOrigin ||
            serviceOrigin.origin !== storedOrigin ||
            serviceOrigin.origin !== testTarget.origin) {
            throw new errors_1.BadRequestError('The credential test URL is not bound to its service origin');
        }
        return await this.credentialsTester.probeCredentialAuth(user.id, storedCredential.type, {
            id: storedCredential.id,
            name: storedCredential.name,
            type: storedCredential.type,
            data,
        }, testTarget.href, {
            acceptedStatusCodes: parseAcceptedStatusCodes(data.acceptedStatusCodes),
            allowedDomains: testTarget.hostname,
        });
    }
    redact(data, credential) {
        const copiedData = (0, n8n_workflow_1.deepCopy)(data);
        let credType;
        try {
            credType = this.credentialTypes.getByName(credential.type);
        }
        catch {
            return data;
        }
        const getExtendedProps = (type) => {
            const props = [];
            for (const e of type.extends ?? []) {
                const extendsType = this.credentialTypes.getByName(e);
                const extendedProps = getExtendedProps(extendsType);
                n8n_workflow_1.NodeHelpers.mergeNodeProperties(props, extendedProps);
            }
            n8n_workflow_1.NodeHelpers.mergeNodeProperties(props, type.properties);
            return props;
        };
        const properties = getExtendedProps(credType);
        return this.redactValues(copiedData, properties);
    }
    redactValues(data, props) {
        for (const dataKey of Object.keys(data)) {
            if (dataKey === 'oauthTokenData' || dataKey === 'csrfSecret') {
                if (String(data[dataKey] ?? '').length > 0) {
                    data[dataKey] = n8n_workflow_1.CREDENTIAL_BLANKING_VALUE;
                }
                else {
                    data[dataKey] = n8n_workflow_1.CREDENTIAL_EMPTY_VALUE;
                }
                continue;
            }
            const prop = props.find((v) => v.name === dataKey);
            if (!prop) {
                continue;
            }
            if (prop.type === 'fixedCollection' && prop.options?.length) {
                const dataObject = data[dataKey];
                for (const option of prop.options) {
                    if ((0, n8n_workflow_1.isINodePropertyCollection)(option)) {
                        this.redactCollectionOption(dataObject, option);
                    }
                }
            }
            if (prop.typeOptions?.password &&
                (!String(data[dataKey] ?? '').startsWith('={{') || prop.noDataExpression)) {
                if (String(data[dataKey] ?? '').length > 0) {
                    data[dataKey] = n8n_workflow_1.CREDENTIAL_BLANKING_VALUE;
                }
                else {
                    data[dataKey] = n8n_workflow_1.CREDENTIAL_EMPTY_VALUE;
                }
                continue;
            }
            if (prop.typeOptions?.redactJsonLeaves) {
                const jsonStr = String(data[dataKey] ?? '');
                if (!jsonStr) {
                    data[dataKey] = n8n_workflow_1.CREDENTIAL_EMPTY_VALUE;
                }
                else {
                    try {
                        const parsed = (0, n8n_workflow_1.jsonParse)(jsonStr);
                        data[dataKey] = JSON.stringify(this.redactJsonLeaves(parsed), null, 2);
                    }
                    catch {
                    }
                }
            }
        }
        return data;
    }
    redactCollectionOption(data, option) {
        const collectionValuesKey = option.name;
        const values = data?.[collectionValuesKey];
        if (Array.isArray(values)) {
            for (let i = 0; i < values.length; i++) {
                values[i] = this.redactValues(values[i], option.values);
            }
        }
        else if (typeof values === 'object' && values !== null) {
            data[collectionValuesKey] = this.redactValues(values, option.values);
        }
    }
    redactJsonLeaves(obj) {
        if (Array.isArray(obj))
            return obj.map((item) => this.redactJsonLeaves(item));
        if (typeof obj === 'object' && obj !== null) {
            return Object.fromEntries(Object.entries(obj).map(([k, v]) => [
                k,
                this.redactJsonLeaves(v),
            ]));
        }
        if (typeof obj === 'string' && obj.startsWith('={{'))
            return obj;
        return CUSTOM_AUTH_JSON_REDACTED_VALUE;
    }
    mergeRedactedJsonLeaves(newVal, savedVal) {
        if (newVal === CUSTOM_AUTH_JSON_REDACTED_VALUE)
            return savedVal;
        if (Array.isArray(newVal) && Array.isArray(savedVal)) {
            return newVal.map((item, i) => this.mergeRedactedJsonLeaves(item, savedVal[i]));
        }
        if (Array.isArray(newVal) || Array.isArray(savedVal)) {
            return newVal;
        }
        if (typeof newVal === 'object' &&
            newVal !== null &&
            typeof savedVal === 'object' &&
            savedVal !== null) {
            return Object.fromEntries(Object.entries(newVal).map(([k, v]) => [
                k,
                this.mergeRedactedJsonLeaves(v, savedVal[k]),
            ]));
        }
        return newVal;
    }
    unredactRestoreValues(unmerged, replacement) {
        for (const [key, value] of Object.entries(unmerged)) {
            const sentinel = typeof value === 'string' && value.startsWith('=') ? value.slice(1) : value;
            if (sentinel === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE || sentinel === n8n_workflow_1.CREDENTIAL_EMPTY_VALUE) {
                unmerged[key] = replacement[key];
            }
            else if (typeof value === 'object' &&
                value !== null &&
                key in replacement &&
                typeof replacement[key] === 'object' &&
                replacement[key] !== null) {
                this.unredactRestoreValues(value, replacement[key]);
            }
        }
    }
    getCredentialTypeProperties(credentialType) {
        try {
            return this.credentialTypes.getByName(credentialType).properties;
        }
        catch {
            return [];
        }
    }
    async getChangedSharedFields(credential, newData) {
        try {
            const credentialType = this.credentialTypes.getByName(credential.type);
            const oldData = await this.decrypt(credential, true);
            return (0, shared_fields_1.getChangedSharedFields)(credentialType, oldData, newData);
        }
        catch {
            return [];
        }
    }
    unredact(redactedData, savedData, props = []) {
        const mergedData = (0, n8n_workflow_1.deepCopy)(redactedData);
        this.unredactRestoreValues(mergedData, savedData);
        for (const prop of props) {
            if (!prop.typeOptions?.redactJsonLeaves)
                continue;
            if (!(prop.name in mergedData) || !(prop.name in savedData))
                continue;
            try {
                const newJson = (0, n8n_workflow_1.jsonParse)(String(mergedData[prop.name]));
                const savedJson = (0, n8n_workflow_1.jsonParse)(String(savedData[prop.name]));
                mergedData[prop.name] = (0, n8n_workflow_1.jsonStringify)(this.mergeRedactedJsonLeaves(newJson, savedJson));
            }
            catch {
            }
        }
        return mergedData;
    }
    async getOne(user, credentialId, includeDecryptedData, options = {}) {
        if (options.includeInstanceCredentials && (0, permissions_1.hasGlobalScope)(user, 'credential:manageInstance')) {
            const instanceCredential = await this.credentialsRepository.findOneBy({
                id: credentialId,
                usageScope: 'instance',
            });
            if (instanceCredential) {
                const { data: _, ...rest } = instanceCredential;
                await this.credentialDescriptions.stripIfDisabled(rest);
                if (includeDecryptedData) {
                    const decryptedData = await this.decrypt(instanceCredential);
                    if (decryptedData.oauthTokenData) {
                        decryptedData.oauthTokenData = true;
                    }
                    return { data: decryptedData, ...rest };
                }
                return { ...rest };
            }
        }
        let sharing = null;
        let decryptedData = null;
        sharing = includeDecryptedData
            ?
                await this.getSharing(user, credentialId, [
                    'credential:read',
                    'credential:update',
                ])
            : null;
        if (sharing) {
            decryptedData = await this.decrypt(sharing.credentials);
        }
        else {
            sharing = await this.getSharing(user, credentialId, ['credential:read']);
        }
        if (!sharing) {
            throw new errors_1.NotFoundError(`Credential with ID "${credentialId}" could not be found.`);
        }
        const { credentials: credential } = sharing;
        const { data: _, ...rest } = credential;
        await this.credentialDescriptions.stripIfDisabled(rest);
        const enriched = rest;
        await this.populateConnectedByMe([enriched], user);
        if (credential.isResolvable) {
            enriched.connectedUserCount = await this.countConnectedUsers(credential.id);
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
    async getCredentialScopes(user, credentialId) {
        const userProjectRelations = await this.projectService.getProjectRelationsForUser(user);
        const projectIds = [...new Set(userProjectRelations.map((pr) => pr.projectId))];
        if (projectIds.length === 0) {
            return this.roleService.combineResourceScopes('credential', user, [], userProjectRelations);
        }
        const shared = await this.sharedCredentialsRepository.find({
            where: {
                projectId: (0, typeorm_1.In)(projectIds),
                credentialsId: credentialId,
            },
        });
        return this.roleService.combineResourceScopes('credential', user, shared, userProjectRelations);
    }
    async transferAll(fromProjectId, toProjectId, trx) {
        trx = trx ?? this.credentialsRepository.manager;
        const allSharedCredentials = await trx.findBy(db_1.SharedCredentials, {
            projectId: (0, typeorm_1.In)([fromProjectId, toProjectId]),
        });
        const sharedCredentialsOfFromProject = allSharedCredentials.filter((sc) => sc.projectId === fromProjectId);
        const ownedCredentialIds = sharedCredentialsOfFromProject
            .filter((sc) => sc.role === 'credential:owner')
            .map((sc) => sc.credentialsId);
        await this.sharedCredentialsRepository.makeOwner(ownedCredentialIds, toProjectId, trx);
        await this.sharedCredentialsRepository.deleteByIds(ownedCredentialIds, fromProjectId, trx);
        const sharedCredentialIdsOfTransferee = allSharedCredentials
            .filter((sc) => sc.projectId === toProjectId)
            .map((sc) => sc.credentialsId);
        const sharedCredentialsToTransfer = sharedCredentialsOfFromProject.filter((sc) => sc.role !== 'credential:owner' &&
            !sharedCredentialIdsOfTransferee.includes(sc.credentialsId));
        await trx.insert(db_1.SharedCredentials, sharedCredentialsToTransfer.map((sc) => ({
            credentialsId: sc.credentialsId,
            projectId: toProjectId,
            role: sc.role,
        })));
    }
    async replaceCredentialContentsForSharee(user, credential, decryptedData, mergedCredentials) {
        if (!(await (0, check_access_1.userHasScopes)(user, ['credential:update'], false, { credentialId: credential.id }))) {
            mergedCredentials.data = decryptedData;
        }
    }
    async createUnmanagedCredential(dto, user, options = {}) {
        return await this.createCredential({ ...dto, isManaged: false }, user, options);
    }
    async createInstanceCredential(dto, user, ctx, options = {}) {
        if (dto.usageScope !== 'instance') {
            throw new errors_1.BadRequestError('Provider connections must use instance usage scope');
        }
        return await this.persistInstanceCredential({ ...dto, isManaged: false }, user, ctx, options);
    }
    async createStubCredential(opts, user) {
        const data = opts.data ?? {};
        await this.validateStubCredentialData(data, user, opts.projectId);
        const encryptedCredential = await this.createEncryptedData({
            id: opts.id ?? null,
            name: opts.name,
            type: opts.type,
            data,
        });
        const credentialEntity = this.credentialsRepository.create({
            ...encryptedCredential,
            isManaged: false,
            isResolvable: false,
        });
        try {
            return await this.insertProjectCredential(credentialEntity, encryptedCredential, user, opts.projectId, data);
        }
        catch (error) {
            if (error instanceof db_1.CredentialIdConflictError) {
                throw new errors_1.BadRequestError(`Cannot create credential stub: a credential with id "${opts.id}" already exists`);
            }
            throw error;
        }
    }
    async validateStubCredentialData(data, user, projectId) {
        await (0, validation_1.validateExternalSecretsPermissions)({ user, projectId, dataToSave: data });
        if (this.externalSecretsConfig.externalSecretsForProjects) {
            await (0, validation_1.validateAccessToReferencedSecretProviders)(projectId, data, this.externalSecretsProviderAccessCheckService, 'create');
        }
    }
    async checkCredentialData(type, data, user, projectId) {
        this.validateCredentialData(type, data);
        await (0, validation_1.validateExternalSecretsPermissions)({ user, projectId, dataToSave: data });
    }
    validateCredentialData(type, data) {
        const credentialProperties = this.credentialsHelper.getCredentialsProperties(type);
        for (const property of credentialProperties) {
            if (property.required &&
                property.displayOptions !== undefined &&
                (0, n8n_workflow_1.displayParameter)(data, property, null, null)) {
                const value = data[property.name];
                const hasDefault = property.default !== undefined && property.default !== null && property.default !== '';
                if ((value === undefined || value === null || value === '') && !hasDefault) {
                    throw new errors_1.BadRequestError(`The field "${property.name}" is mandatory for credentials of type "${type}"`);
                }
            }
        }
        this.validateOAuthCredentialUrls(type, data);
    }
    isOAuthCredentialType(type) {
        const parentTypes = this.credentialTypes.getParentTypes(type) ?? [];
        return (type === 'oAuth1Api' ||
            type === 'oAuth2Api' ||
            parentTypes.includes('oAuth1Api') ||
            parentTypes.includes('oAuth2Api'));
    }
    validateOAuthCredentialUrls(type, data) {
        const parentTypes = this.credentialTypes.getParentTypes(type) ?? [];
        const isOAuth2 = type === 'oAuth2Api' || parentTypes.includes('oAuth2Api');
        const isOAuth1 = type === 'oAuth1Api' || parentTypes.includes('oAuth1Api');
        if (isOAuth2) {
            const oauthUrlFields = ['authUrl', 'accessTokenUrl', 'serverUrl'];
            for (const field of oauthUrlFields) {
                const value = data[field];
                if (typeof value === 'string' && value.trim() !== '' && !(0, n8n_workflow_1.isExpression)(value)) {
                    (0, validate_oauth_url_1.validateOAuthUrl)(value);
                }
            }
        }
        if (isOAuth1) {
            const oauthUrlFields = ['authUrl', 'requestTokenUrl', 'accessTokenUrl'];
            for (const field of oauthUrlFields) {
                const value = data[field];
                if (typeof value === 'string' && value.trim() !== '' && !(0, n8n_workflow_1.isExpression)(value)) {
                    (0, validate_oauth_url_1.validateOAuthUrl)(value);
                }
            }
        }
    }
    async createManagedCredential(dto, user) {
        return await this.createCredential({ ...dto, isManaged: true }, user);
    }
    ensureEndUserCredentialAllowedInProject(project) {
        if (project?.type === 'personal') {
            throw new errors_1.ForbiddenError('End-user credentials are not available in personal projects');
        }
    }
    async ensureCanManageEndUserCredential(user, projectId) {
        const allowed = projectId !== undefined &&
            (await (0, check_access_1.userHasScopes)(user, ['credential:createEndUser'], false, { projectId }));
        if (!allowed) {
            throw new errors_1.ForbiddenError('You do not have permission to manage end-user credentials in this project');
        }
    }
    async createCredential(opts, user, options = {}) {
        if (opts.pendingAuthorization && (opts.isResolvable || opts.usageScope === 'instance')) {
            throw new errors_1.BadRequestError('Pending authorization is only supported for project-scoped, non-resolvable credentials');
        }
        if (opts.usageScope === 'instance') {
            if (options.id !== undefined) {
                throw new errors_1.BadRequestError('A supplied ID requires project usage scope');
            }
            const savedCredential = await this.persistInstanceCredential(opts, user, {});
            const scopes = await this.getCredentialScopes(user, savedCredential.id);
            const { shared, ...credential } = savedCredential;
            return { ...credential, scopes };
        }
        const targetProjectId = await this.resolveOwningProjectIdForNewCredential(user, opts.projectId);
        if (opts.isResolvable === true) {
            const targetProject = await this.projectRepository.findOneBy({ id: targetProjectId });
            this.ensureEndUserCredentialAllowedInProject(targetProject);
            await this.ensureCanManageEndUserCredential(user, targetProjectId);
        }
        await this.checkCredentialData(opts.type, opts.data, user, targetProjectId);
        if (this.externalSecretsConfig.externalSecretsForProjects) {
            await (0, validation_1.validateAccessToReferencedSecretProviders)(targetProjectId, opts.data, this.externalSecretsProviderAccessCheckService, 'create');
        }
        const encryptedCredential = await this.createEncryptedData({
            id: options.id ?? null,
            name: opts.name,
            type: opts.type,
            data: opts.data,
        });
        if (await this.credentialDescriptions.isEnabled()) {
            encryptedCredential.description = (0, validation_1.parseCredentialDescription)(opts.description);
        }
        const isGlobal = opts.isGlobal;
        if (isGlobal === true) {
            const canShareGlobally = (0, permissions_1.hasGlobalScope)(user, 'credential:shareGlobally');
            if (!canShareGlobally) {
                throw new errors_1.ForbiddenError('You do not have permission to create globally shared credentials');
            }
            encryptedCredential.isGlobal = isGlobal;
        }
        const credentialEntity = this.credentialsRepository.create({
            ...encryptedCredential,
            isManaged: opts.isManaged,
            isResolvable: opts.isResolvable ?? false,
            pendingAuthorizationExpiresAt: opts.pendingAuthorization
                ? new Date(Date.now() + exports.PENDING_AUTHORIZATION_GRACE_MS)
                : null,
        });
        const persist = options.id === undefined ? this.save.bind(this) : this.insertProjectCredential.bind(this);
        const { shared, ...credential } = await persist(credentialEntity, encryptedCredential, user, targetProjectId, opts.data).catch((error) => {
            if (error instanceof db_1.CredentialIdConflictError) {
                throw new errors_1.ConflictError('A credential with this ID already exists');
            }
            throw error;
        });
        const scopes = await this.getCredentialScopes(user, credential.id);
        await this.credentialDescriptions.stripIfDisabled(credential);
        return { ...credential, scopes };
    }
    async persistInstanceCredential(opts, user, ctx, options = {}) {
        if (!(0, permissions_1.hasGlobalScope)(user, 'credential:manageInstance')) {
            throw new errors_1.ForbiddenError('You do not have permission to create provider connections');
        }
        if (opts.isGlobal === true) {
            throw new errors_1.BadRequestError('Provider connections cannot be globally shared');
        }
        if (opts.isResolvable === true || opts.isManaged) {
            throw new errors_1.BadRequestError('Provider connections cannot be end-user or managed credentials');
        }
        const data = opts.data;
        this.validateInstanceCredentialData(data);
        this.validateCredentialData(opts.type, data);
        const encryptedCredential = options.encryptedData ??
            (await this.createEncryptedData({
                id: null,
                name: opts.name,
                type: opts.type,
                data,
            }));
        if (!options.skipExternalHooks) {
            await this.externalHooks.run('credentials.create', [encryptedCredential]);
        }
        const hookedData = await this.getValidatedInstanceCredentialHookData(encryptedCredential, null, opts.type);
        this.validateInstanceCredentialData(hookedData);
        this.validateCredentialData(opts.type, hookedData);
        await this.credentialDescriptions.stripIfDisabled(encryptedCredential);
        const credentialEntity = this.credentialsRepository.create({
            ...encryptedCredential,
            ...((await this.credentialDescriptions.isEnabled()) && {
                description: (0, validation_1.parseCredentialDescription)(opts.description),
            }),
            isManaged: false,
            isResolvable: false,
            usageScope: 'instance',
        });
        const cleared = await this.enforceCredentialCreate(credentialEntity.type, null, user);
        const savedCredential = await this.credentialsRepository.saveInstanceCredential(credentialEntity, { ...ctx, policyCleared: cleared });
        this.logger.debug('New instance credential created', {
            credentialId: savedCredential.id,
            ownerId: user.id,
        });
        await this.credentialDescriptions.stripIfDisabled(savedCredential);
        return savedCredential;
    }
    async getValidatedInstanceCredentialHookData(credential, expectedId, expectedType) {
        if ((credential.id ?? null) !== expectedId) {
            throw new errors_1.BadRequestError('Provider connection hooks cannot change the credential ID');
        }
        if (credential.type !== expectedType) {
            throw new errors_1.BadRequestError('Provider connection hooks cannot change the credential type');
        }
        if (credential.isGlobal ||
            credential.isManaged ||
            credential.isResolvable ||
            credential.resolvableAllowFallback ||
            (credential.resolverId !== undefined && credential.resolverId !== null) ||
            (credential.usageScope !== undefined && credential.usageScope !== 'instance')) {
            throw new errors_1.BadRequestError('Provider connection hooks cannot change the credential scope');
        }
        try {
            return await (0, credentials_helper_1.createCredentialsFromCredentialsEntity)(credential).getData();
        }
        catch (error) {
            if (error instanceof n8n_core_1.CredentialDataError) {
                throw new errors_1.BadRequestError('Provider connection hooks returned invalid credential data');
            }
            throw error;
        }
    }
    validateInstanceCredentialData(data) {
        if ((0, external_secrets_utils_1.getExternalSecretExpressionPaths)(data).length > 0) {
            throw new errors_1.BadRequestError('Provider connections cannot reference project-scoped external secrets');
        }
    }
    async validateInstanceCredentialUpdate(credential, data, credentialUseIds, ctx = {}) {
        this.validateInstanceCredentialData(data);
        const assignedUseIds = credentialUseIds ??
            (await this.instanceCredentialAssignmentRepository.findCredentialUseIds(credential.id, ctx));
        for (const credentialUseId of assignedUseIds) {
            const credentialUse = this.instanceCredentialUseRegistry.get(credentialUseId);
            if (!credentialUse.credentialTypes.includes(credential.type)) {
                throw new errors_1.BadRequestError(`Credential type "${credential.type}" is not valid for instance credential use "${credentialUseId}"`);
            }
            credentialUse.validate?.({ type: credential.type, data });
        }
    }
    async prepareCredentialsForUse({ storedCredential, user, credentialsToUse, }) {
        if (credentialsToUse && credentialsToUse.type !== storedCredential.type) {
            throw new errors_1.BadRequestError('The credential type does not match the stored credential');
        }
        const owningProject = await this.findCredentialOwningProject(storedCredential.id);
        const decryptedData = await this.decryptForUse(storedCredential, { kind: 'user', user }, owningProject?.id ?? null);
        const mergedCredentials = credentialsToUse
            ? (0, n8n_workflow_1.deepCopy)(credentialsToUse)
            : {
                id: storedCredential.id,
                name: storedCredential.name,
                type: storedCredential.type,
                data: decryptedData,
            };
        if (!owningProject) {
            mergedCredentials.homeProject = undefined;
        }
        else {
            mergedCredentials.homeProject = {
                id: owningProject.id,
                name: owningProject.name,
                icon: owningProject.icon,
                type: owningProject.type,
                createdAt: owningProject.createdAt.toISOString(),
                updatedAt: owningProject.updatedAt.toISOString(),
            };
        }
        if (credentialsToUse) {
            await this.replaceCredentialContentsForSharee(user, storedCredential, decryptedData, mergedCredentials);
            if (mergedCredentials.data) {
                mergedCredentials.data = this.unredact(mergedCredentials.data, decryptedData, this.getCredentialTypeProperties(storedCredential.type));
            }
        }
        return { credentials: mergedCredentials, storedData: decryptedData };
    }
};
exports.CredentialsService = CredentialsService;
exports.CredentialsService = CredentialsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.CredentialsRepository, credential_dependency_service_1.CredentialDependencyService, db_1.SharedCredentialsRepository, ownership_service_1.OwnershipService, backend_common_1.Logger, n8n_core_1.ErrorReporter, credentials_tester_service_1.CredentialsTester, external_hooks_1.ExternalHooks, credential_types_1.CredentialTypes, db_1.ProjectRepository, project_service_ee_1.ProjectService, backend_services_1.RoleService, db_1.UserRepository, backend_services_1.CredentialsFinderService, credentials_helper_1.CredentialsHelper, external_secrets_config_1.ExternalSecretsConfig, secret_provider_access_check_service_ee_1.SecretsProviderAccessCheckService, credential_connection_status_proxy_1.CredentialConnectionStatusProxy, db_1.InstanceCredentialAssignmentRepository, instance_credential_use_registry_1.InstanceCredentialUseRegistry, db_1.DbLockService, backend_services_1.EventService, db_1.TransactionRunner, policy_enforcement_service_1.PolicyEnforcementService, credential_descriptions_service_1.CredentialDescriptionsService])
], CredentialsService);
//# sourceMappingURL=credentials.service.js.map