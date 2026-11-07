"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userHasScopes = userHasScopes;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const errors_1 = require("@n8n/errors");
const INSTANCE_CREDENTIAL_MANAGEMENT_SCOPES = new Set([
    'credential:read',
    'credential:update',
    'credential:delete',
]);
async function hasGlobalCredentialAccess(credentialsFinderService, credentialId, scopes) {
    const isReadOnlyRequest = credentialsFinderService.hasGlobalReadOnlyAccess(scopes);
    const isConnectRequest = credentialsFinderService.hasGlobalConnectAccess(scopes);
    if (!isReadOnlyRequest && !isConnectRequest)
        return false;
    const globalCredential = await credentialsFinderService.findGlobalCredentialById(credentialId);
    if (!globalCredential)
        return false;
    return isReadOnlyRequest || globalCredential.isResolvable;
}
async function userHasScopes(user, scopes, globalOnly, { credentialId, workflowId, projectId, dataTableId, }, entityManager) {
    if ((0, permissions_1.hasGlobalScope)(user, scopes, { mode: 'allOf' }))
        return true;
    if (credentialId &&
        (0, permissions_1.hasGlobalScope)(user, 'credential:manageInstance') &&
        scopes.every((scope) => INSTANCE_CREDENTIAL_MANAGEMENT_SCOPES.has(scope))) {
        const credentialsRepository = entityManager
            ? entityManager.getRepository(db_1.CredentialsEntity)
            : di_1.Container.get(db_1.CredentialsRepository);
        if (await credentialsRepository.existsBy({
            id: credentialId,
            usageScope: 'instance',
        })) {
            return true;
        }
    }
    if (globalOnly)
        return false;
    const projectQueryBuilder = entityManager
        ? entityManager.createQueryBuilder(db_1.Project, 'project')
        : di_1.Container.get(db_1.ProjectRepository).createQueryBuilder('project');
    const userProjectIds = (await projectQueryBuilder
        .innerJoin('project.projectRelations', 'relation')
        .innerJoin('relation.role', 'role')
        .innerJoin('role.scopes', 'scope')
        .where('relation.userId = :userId', { userId: user.id })
        .andWhere('scope.slug IN (:...scopes)', { scopes })
        .groupBy('project.id')
        .having('COUNT(DISTINCT scope.slug) = :scopeCount', { scopeCount: scopes.length })
        .select(['project.id AS id'])
        .getRawMany()).map((row) => row.id);
    const roleService = di_1.Container.get(backend_services_1.RoleService);
    const loadRoles = entityManager
        ? async () => await di_1.Container.get(db_1.RoleRepository).findAll(entityManager)
        : undefined;
    const rolesWithScope = async (namespace) => loadRoles
        ? await roleService.rolesWithScope(namespace, scopes, loadRoles)
        : await roleService.rolesWithScope(namespace, scopes);
    if (credentialId) {
        const credentialRepo = entityManager
            ? entityManager.getRepository(db_1.SharedCredentials)
            : di_1.Container.get(db_1.SharedCredentialsRepository);
        const credentials = await credentialRepo.findBy({ credentialsId: credentialId });
        if (!credentials.length) {
            throw new errors_1.NotFoundError(`Credential with ID "${credentialId}" not found.`);
        }
        const validRoles = await rolesWithScope('credential');
        const hasValidRoles = credentials.some((c) => userProjectIds.includes(c.projectId) && validRoles.includes(c.role));
        if (hasValidRoles) {
            return true;
        }
        const credentialsFinderService = di_1.Container.get(backend_services_1.CredentialsFinderService);
        return await hasGlobalCredentialAccess(credentialsFinderService, credentialId, scopes);
    }
    if (workflowId) {
        const workflowRepo = entityManager
            ? entityManager.getRepository(db_1.SharedWorkflow)
            : di_1.Container.get(db_1.SharedWorkflowRepository);
        const workflows = await workflowRepo.findBy({ workflowId });
        if (!workflows.length) {
            throw new errors_1.NotFoundError(`Workflow with ID "${workflowId}" not found.`);
        }
        const validRoles = await rolesWithScope('workflow');
        return workflows.some((w) => userProjectIds.includes(w.projectId) && validRoles.includes(w.role));
    }
    if (dataTableId) {
        const moduleRegistry = di_1.Container.get(backend_common_1.ModuleRegistry);
        if (!moduleRegistry.isActive('data-table')) {
            throw new errors_1.NotFoundError(`Data table with ID "${dataTableId}" not found.`);
        }
        const { DataTableRepository } = await import('../modules/data-table/data-table.repository.js');
        const dataTable = await di_1.Container.get(DataTableRepository).findOne({
            where: { id: dataTableId },
            relations: ['project'],
        });
        if (!dataTable) {
            throw new errors_1.NotFoundError(`Data table with ID "${dataTableId}" not found.`);
        }
        return userProjectIds.includes(dataTable.project.id);
    }
    if (projectId)
        return userProjectIds.includes(projectId);
    throw new n8n_workflow_1.UnexpectedError("`@ProjectScope` decorator was used but does not have a `credentialId`, `workflowId`, `dataTableId`, or `projectId` in its URL parameters. This is likely an implementation error. If you're a developer, please check your URL is correct or that this should be using `@GlobalScope`.");
}
//# sourceMappingURL=check-access.js.map