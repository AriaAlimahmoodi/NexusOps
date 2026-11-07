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
var CredentialsPermissionChecker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsPermissionChecker = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const n8n_workflow_1 = require("n8n-workflow");
const credential_sharing_1 = require("../../constants/credential-sharing");
const backend_services_1 = require("@n8n/backend-services");
const node_types_1 = require("../../node-types");
const ownership_service_1 = require("../../services/ownership.service");
const project_service_ee_1 = require("../../services/project.service.ee");
class InvalidCredentialError extends n8n_workflow_1.UserError {
    constructor(node) {
        super(`Node "${node.name}" uses invalid credential`);
        this.node = node;
        this.description = 'Please recreate the credential.';
    }
}
class InaccessibleCredentialForUserError extends n8n_workflow_1.UserError {
    constructor(node) {
        super(`Node "${node.name}" uses a credential you do not have access to`);
        this.node = node;
        this.description = 'This node uses a credential you do not have access to. Ask its owner to share it with you.';
    }
}
class UnusableCredentialForUserError extends n8n_workflow_1.UserError {
    constructor(node, credential) {
        super(`Node "${node.name}" uses the credential "${credential.name}", which you cannot use`);
        this.node = node;
        this.description =
            credential.ownerProject?.type === 'team'
                ? `Ask an admin of the project "${credential.ownerProject.name}" to share this credential with you.`
                : 'Ask its owner to share this credential with you.';
    }
}
class InaccessibleCredentialError extends n8n_workflow_1.UserError {
    constructor(node, project) {
        super(`Node "${node.name}" does not have access to the credential`);
        this.node = node;
        this.project = project;
        this.description = this.project.type === 'personal'
            ? 'Please recreate the credential or ask its owner to share it with you.'
            : `Please make sure that the credential is shared with the project "${this.project.name}"`;
    }
}
let CredentialsPermissionChecker = CredentialsPermissionChecker_1 = class CredentialsPermissionChecker {
    constructor(sharedCredentialsRepository, credentialsRepository, ownershipService, projectService, nodeTypes, userRepository, credentialsFinderService, logger) {
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.credentialsRepository = credentialsRepository;
        this.ownershipService = ownershipService;
        this.projectService = projectService;
        this.nodeTypes = nodeTypes;
        this.userRepository = userRepository;
        this.credentialsFinderService = credentialsFinderService;
        this.logger = logger;
    }
    async checkForUser(userId, nodes) {
        const credIdsToNodes = this.mapCredIdsToNodes(nodes);
        const workflowCredIds = Object.keys(credIdsToNodes);
        if (workflowCredIds.length === 0)
            return;
        const { instanceScoped, notGranted } = await this.findUnusable(await this.loadUserWithRole(userId), workflowCredIds);
        if (instanceScoped.length > 0) {
            throw new InaccessibleCredentialForUserError(credIdsToNodes[instanceScoped[0].id][0]);
        }
        if (notGranted.length === 0)
            return;
        const nodeToFlag = credIdsToNodes[notGranted[0].id][0];
        throw (0, credential_sharing_1.isCredSharingEnabled)()
            ? new UnusableCredentialForUserError(nodeToFlag, notGranted[0])
            : new InaccessibleCredentialForUserError(nodeToFlag);
    }
    async findInaccessibleForUser(userId, nodes, workflowId) {
        if (!(0, credential_sharing_1.isCredSharingEnabled)())
            return [];
        const credIdsToNodes = this.mapCredIdsToNodes(nodes);
        const workflowCredIds = Object.keys(credIdsToNodes);
        if (workflowCredIds.length === 0)
            return [];
        const unusable = await this.findUnusableInWorkflow(workflowId, workflowCredIds, userId);
        return unusable.map(({ id, name, exists }) => ({
            id,
            name: name === id ? this.cachedCredentialName(id, credIdsToNodes) : name,
            exists,
        }));
    }
    cachedCredentialName(credentialId, credIdsToNodes) {
        for (const cred of Object.values(credIdsToNodes[credentialId]?.[0]?.credentials ?? {})) {
            if (cred.id === credentialId)
                return cred.name;
        }
        return credentialId;
    }
    async findUnusable(user, credentialIds, options = {}) {
        const { instanceScopedIds, projectScopedIds } = await this.partitionByUsageScope(credentialIds);
        const instanceScoped = instanceScopedIds.length
            ? await this.credentialsFinderService.describeCredentials(instanceScopedIds)
            : [];
        if (projectScopedIds.length === 0)
            return { instanceScoped, notGranted: [] };
        const notGranted = await this.credentialsFinderService.findUnusableCredentialsForUser(user, projectScopedIds, options);
        return { instanceScoped, notGranted };
    }
    static flatten({ instanceScoped, notGranted }) {
        return [...instanceScoped, ...notGranted];
    }
    async partitionByUsageScope(credentialIds) {
        const instanceScoped = await this.credentialsRepository.findNonProjectCredentialsByIds(credentialIds);
        if (instanceScoped.length === 0) {
            return { instanceScopedIds: [], projectScopedIds: credentialIds };
        }
        const instanceScopedSet = new Set(instanceScoped.map((c) => c.id));
        return {
            instanceScopedIds: credentialIds.filter((id) => instanceScopedSet.has(id)),
            projectScopedIds: credentialIds.filter((id) => !instanceScopedSet.has(id)),
        };
    }
    async resolveInaccessibleCredentialIdsForUserId(userId, credentialIds, options = {}) {
        const unusable = CredentialsPermissionChecker_1.flatten(await this.findUnusable(await this.loadUserWithRole(userId), credentialIds, options));
        return unusable.map((c) => c.id);
    }
    async resolveInaccessibleCredentialIdsForUser(user, credentialIds, options = {}) {
        const unusable = CredentialsPermissionChecker_1.flatten(await this.findUnusable(user, credentialIds, options));
        return unusable.map((c) => c.id);
    }
    async loadUserWithRole(userId) {
        return await this.userRepository.findOne({ where: { id: userId }, relations: ['role'] });
    }
    async check(workflowId, nodes, actingUserId) {
        const credIdsToNodes = this.mapCredIdsToNodes(nodes);
        const workflowCredIds = Object.keys(credIdsToNodes);
        if (workflowCredIds.length === 0)
            return;
        const { homeProject, inaccessibleIds, unusableForActingUser } = await this.findInaccessible(workflowId, workflowCredIds, actingUserId);
        if (inaccessibleIds.length === 0)
            return;
        const unusable = unusableForActingUser.find((c) => c.id === inaccessibleIds[0]);
        const nodeToFlag = credIdsToNodes[inaccessibleIds[0]][0];
        throw unusable
            ? new UnusableCredentialForUserError(nodeToFlag, unusable)
            : new InaccessibleCredentialError(nodeToFlag, homeProject);
    }
    async findInaccessible(workflowId, credentialIds, actingUserId) {
        const homeProject = await this.ownershipService.getWorkflowProjectCached(workflowId);
        const { instanceScopedIds, projectScopedIds } = await this.partitionByUsageScope(credentialIds);
        if (instanceScopedIds.length > 0) {
            return { homeProject, inaccessibleIds: instanceScopedIds, unusableForActingUser: [] };
        }
        const homeProjectOwner = await this.ownershipService.getPersonalProjectOwnerCached(homeProject.id);
        if (homeProject.type === 'personal' &&
            homeProjectOwner &&
            (0, permissions_1.hasGlobalScope)(homeProjectOwner, 'credential:use')) {
            return { homeProject, inaccessibleIds: [], unusableForActingUser: [] };
        }
        const projectIds = await this.projectService.findProjectsWorkflowIsIn(workflowId);
        const accessible = await this.sharedCredentialsRepository.getFilteredAccessibleCredentials(projectIds, projectScopedIds);
        const global = await this.credentialsRepository.findGlobalProjectCredentialIds(projectScopedIds);
        const accessibleSet = new Set([...accessible, ...global]);
        const rejectedByProject = projectScopedIds.filter((id) => !accessibleSet.has(id));
        if (rejectedByProject.length === 0) {
            return { homeProject, inaccessibleIds: [], unusableForActingUser: [] };
        }
        if (!(0, credential_sharing_1.isCredSharingEnabled)()) {
            return { homeProject, inaccessibleIds: rejectedByProject, unusableForActingUser: [] };
        }
        if (!actingUserId) {
            this.logger.warn('Refusing a run with no identity to attribute it to; republish the workflow to restore attribution', { workflowId, credentialIds: rejectedByProject });
            return { homeProject, inaccessibleIds: rejectedByProject, unusableForActingUser: [] };
        }
        const actingUser = await this.loadUserWithRole(actingUserId);
        if (!actingUser) {
            return { homeProject, inaccessibleIds: rejectedByProject, unusableForActingUser: [] };
        }
        const unusableForActingUser = await this.credentialsFinderService.findUnusableCredentialsForUser(actingUser, rejectedByProject, { ignoreGlobalUseScope: homeProject.type === 'team' });
        return {
            homeProject,
            inaccessibleIds: rejectedByProject.filter((id) => unusableForActingUser.some((c) => c.id === id)),
            unusableForActingUser,
        };
    }
    async findUnusableInWorkflow(workflowId, credentialIds, userId) {
        if (!(0, credential_sharing_1.isCredSharingEnabled)() || credentialIds.length === 0)
            return [];
        const homeProject = await this.ownershipService.getWorkflowProjectCached(workflowId);
        const isTeamProject = homeProject.type === 'team';
        const { instanceScopedIds, projectScopedIds } = await this.partitionByUsageScope(credentialIds);
        const carried = await this.findCarried(isTeamProject ? await this.projectService.findTeamProjectsWorkflowIsIn(workflowId) : [], projectScopedIds);
        const leftover = projectScopedIds.filter((id) => !carried.has(id));
        const [instanceScoped, notGranted] = await Promise.all([
            instanceScopedIds.length > 0
                ? this.credentialsFinderService.describeCredentials(instanceScopedIds)
                : [],
            leftover.length > 0
                ? this.credentialsFinderService.findUnusableCredentialsForUser(await this.loadUserWithRole(userId), leftover, { ignoreGlobalUseScope: isTeamProject })
                : [],
        ]);
        return [...instanceScoped, ...notGranted];
    }
    async findCarried(teamProjectIds, projectScopedIds) {
        if (projectScopedIds.length === 0)
            return new Set();
        const [shared, global] = await Promise.all([
            teamProjectIds.length > 0
                ? this.sharedCredentialsRepository.getFilteredAccessibleCredentials(teamProjectIds, projectScopedIds)
                : [],
            this.credentialsRepository.findGlobalProjectCredentialIds(projectScopedIds),
        ]);
        return new Set([...shared, ...global]);
    }
    getCredentialIdsForNodes(nodes) {
        const ids = new Set();
        for (const node of nodes) {
            if (node.disabled === true || !node.credentials)
                continue;
            const activeCredTypes = this.getActiveCredentialTypes(node);
            for (const [credType, cred] of Object.entries(node.credentials)) {
                if (!cred.id)
                    continue;
                if (activeCredTypes !== null && !activeCredTypes.has(credType))
                    continue;
                ids.add(cred.id);
            }
        }
        return [...ids];
    }
    mapCredIdsToNodes(nodes) {
        return nodes.reduce((map, node) => {
            if (node.disabled === true || !node.credentials)
                return map;
            const activeCredTypes = this.getActiveCredentialTypes(node);
            for (const [credType, cred] of Object.entries(node.credentials)) {
                if (!cred.id) {
                    if (cred.__aiGatewayManaged === true)
                        continue;
                    throw new InvalidCredentialError(node);
                }
                if (activeCredTypes !== null && !activeCredTypes.has(credType))
                    continue;
                map[cred.id] = map[cred.id] ? [...map[cred.id], node] : [node];
            }
            return map;
        }, {});
    }
    getActiveCredentialTypes(node) {
        let nodeTypeDescription = null;
        try {
            nodeTypeDescription = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion).description;
        }
        catch {
        }
        return (0, n8n_workflow_1.getActiveCredentialTypes)(node, nodeTypeDescription);
    }
};
exports.CredentialsPermissionChecker = CredentialsPermissionChecker;
exports.CredentialsPermissionChecker = CredentialsPermissionChecker = CredentialsPermissionChecker_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SharedCredentialsRepository, db_1.CredentialsRepository, ownership_service_1.OwnershipService, project_service_ee_1.ProjectService, node_types_1.NodeTypes, db_1.UserRepository, backend_services_1.CredentialsFinderService, backend_common_1.Logger])
], CredentialsPermissionChecker);
//# sourceMappingURL=credentials-permission-checker.js.map