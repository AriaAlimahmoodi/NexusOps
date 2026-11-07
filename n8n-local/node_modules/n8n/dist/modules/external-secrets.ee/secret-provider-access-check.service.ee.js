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
exports.SecretsProviderAccessCheckService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const errors_1 = require("@n8n/errors");
const project_service_ee_1 = require("../../services/project.service.ee");
const backend_services_1 = require("@n8n/backend-services");
let SecretsProviderAccessCheckService = class SecretsProviderAccessCheckService {
    constructor(connectionRepository, projectAccessRepository, roleService, projectService) {
        this.connectionRepository = connectionRepository;
        this.projectAccessRepository = projectAccessRepository;
        this.roleService = roleService;
        this.projectService = projectService;
    }
    async isProviderAvailableInProject(providerKey, projectId) {
        return await this.connectionRepository.isProviderAvailableInProject(providerKey, projectId);
    }
    async assertConnectionAccess({ providerKey, projectId, requiredScope, user, }) {
        const access = await this.projectAccessRepository.findOne({
            where: {
                secretsProviderConnection: { providerKey },
                projectId,
            },
        });
        if (!access) {
            throw new errors_1.NotFoundError(`Connection with key "${providerKey}" not found in project "${projectId}"`);
        }
        if ((0, permissions_1.hasGlobalScope)(user, requiredScope)) {
            return;
        }
        const validRoles = await this.roleService.rolesWithScope('secretsProviderConnection', [
            requiredScope,
        ]);
        if (!validRoles.includes(access.role)) {
            throw new errors_1.ForbiddenError('Project does not have the required access level for this connection');
        }
    }
    async getConnectionScopesForProject(user, providerKey, projectId) {
        const globalScopes = (0, permissions_1.getAuthPrincipalScopes)(user, [
            'externalSecretsProvider',
            'externalSecret',
        ]);
        const access = await this.projectAccessRepository.findOne({
            where: {
                secretsProviderConnection: { providerKey },
                projectId,
            },
        });
        const sharingRoleSlug = access?.role ?? 'secretsProviderConnection:user';
        const userProjectRelations = await this.projectService.getProjectRelationsForUser(user);
        const projectRelation = userProjectRelations.find((pr) => pr.projectId === projectId);
        const projectScopes = projectRelation
            ? projectRelation.role.scopes.map((s) => s.slug)
            : [];
        const sharingRole = await this.roleService.getRole(sharingRoleSlug);
        const sharingScopes = sharingRole.scopes;
        const mergedScopes = (0, permissions_1.combineScopes)({ global: globalScopes, project: projectScopes }, { sharing: sharingScopes });
        return [...mergedScopes].sort();
    }
};
exports.SecretsProviderAccessCheckService = SecretsProviderAccessCheckService;
exports.SecretsProviderAccessCheckService = SecretsProviderAccessCheckService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SecretsProviderConnectionRepository, db_1.ProjectSecretsProviderAccessRepository, backend_services_1.RoleService, project_service_ee_1.ProjectService])
], SecretsProviderAccessCheckService);
//# sourceMappingURL=secret-provider-access-check.service.ee.js.map