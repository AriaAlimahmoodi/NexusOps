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
exports.VariablesService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const feature_not_licensed_error_1 = require("../../errors/feature-not-licensed.error");
const errors_1 = require("@n8n/errors");
const variable_count_limit_reached_error_1 = require("../../errors/variable-count-limit-reached.error");
const variable_validation_error_1 = require("../../errors/variable-validation.error");
const backend_services_1 = require("@n8n/backend-services");
const project_service_ee_1 = require("../../services/project.service.ee");
const projectVariableScopes = {
    'variable:list': 'projectVariable:list',
    'variable:read': 'projectVariable:read',
    'variable:create': 'projectVariable:create',
    'variable:update': 'projectVariable:update',
    'variable:delete': 'projectVariable:delete',
};
let VariablesService = class VariablesService {
    constructor(cacheService, variablesRepository, eventService, licenseState, projectService) {
        this.cacheService = cacheService;
        this.variablesRepository = variablesRepository;
        this.eventService = eventService;
        this.licenseState = licenseState;
        this.projectService = projectService;
    }
    async findAll() {
        const variables = await this.variablesRepository.find({
            relations: ['project'],
        });
        return variables;
    }
    async isAuthorizedForVariable(user, scope, projectId) {
        if (!projectId) {
            return (0, permissions_1.hasGlobalScope)(user, scope);
        }
        const projectVariableScope = projectVariableScopes[scope];
        if (!projectVariableScope)
            throw new Error(`No project variable scope mapping for scope "${scope}"`);
        const project = await this.projectService.getProjectWithScope(user, projectId, [
            projectVariableScope,
        ]);
        return !!project;
    }
    async getAllCached(filters = { globalOnly: false }) {
        const variables = (await this.cacheService.get('variables', {
            refreshFn: async () => await this.findAll(),
        })) ?? [];
        if (filters.globalOnly) {
            return variables.filter((v) => !v.project);
        }
        return variables;
    }
    async getCached(id) {
        const variables = await this.getAllCached();
        const foundVariable = variables.find((variable) => variable.id === id);
        if (!foundVariable) {
            return null;
        }
        return foundVariable;
    }
    async updateCache() {
        const variables = await this.findAll();
        await this.cacheService.set('variables', variables);
    }
    async getAllForUser(user, filter = {}) {
        const allCachedVariables = await this.getAllCached();
        const canListGlobalVariables = (0, permissions_1.hasGlobalScope)(user, 'variable:list');
        const projectIds = await this.projectService.getProjectIdsWithScope(user, [
            'projectVariable:list',
        ]);
        const userHasAccess = (variable) => (!variable.project && canListGlobalVariables) ||
            (variable.project &&
                projectIds.includes(variable.project.id));
        const stateAndProjectFilter = (variable) => (filter.state !== 'empty' || variable.value === '') &&
            (typeof filter.projectId === 'undefined' ||
                (variable.project?.id ?? null) === filter.projectId);
        return allCachedVariables.filter((variable) => userHasAccess(variable) && stateAndProjectFilter(variable));
    }
    async getForUser(user, variableId, scope = 'variable:read') {
        const variable = await this.getCached(variableId);
        if (!variable) {
            return null;
        }
        const userHasAccess = await this.isAuthorizedForVariable(user, scope, variable.project?.id);
        if (!userHasAccess) {
            throw new errors_1.ForbiddenError('You are not allowed to access this variable');
        }
        return variable;
    }
    async deleteForUser(user, id) {
        const existingVariable = await this.getCached(id);
        const userHasRight = await this.isAuthorizedForVariable(user, 'variable:delete', existingVariable?.project?.id);
        if (!userHasRight) {
            throw new errors_1.ForbiddenError('You are not allowed to delete this variable');
        }
        await this.delete(id);
        this.eventService.emit('variable-deleted', {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            variableId: id,
            variableKey: existingVariable?.key ?? '',
            ...(existingVariable?.project?.id && { projectId: existingVariable.project.id }),
        });
    }
    async delete(id) {
        await this.variablesRepository.delete(id);
        await this.updateCache();
    }
    async deleteByIds(ids) {
        await this.variablesRepository.deleteByIds(ids);
        await this.updateCache();
    }
    async getRemainingVariableQuota() {
        const limit = this.licenseState.getMaxVariables();
        if (limit === constants_1.UNLIMITED_LICENSE_QUOTA)
            return null;
        const variablesCount = (await this.getAllCached()).length;
        return { limit, remaining: Math.max(0, limit - variablesCount) };
    }
    async canCreateNewVariable() {
        if (!this.licenseState.isVariablesLicensed()) {
            throw new feature_not_licensed_error_1.FeatureNotLicensedError('feat:variables');
        }
        const quota = await this.getRemainingVariableQuota();
        if (quota && quota.remaining === 0) {
            throw new variable_count_limit_reached_error_1.VariableCountLimitReachedError('Variables limit reached');
        }
    }
    async validateUniqueVariable(key, projectId, id) {
        const existingVariablesByKey = (await this.getAllCached()).filter((v) => v.key === key && (!id || v.id !== id));
        if (!projectId && existingVariablesByKey.find((v) => !v.project)) {
            throw new variable_count_limit_reached_error_1.VariableCountLimitReachedError(`A global variable with key "${key}" already exists`);
        }
        if (projectId && existingVariablesByKey.find((v) => v.project?.id === projectId)) {
            throw new variable_count_limit_reached_error_1.VariableCountLimitReachedError(`A variable with key "${key}" already exists in the specified project`);
        }
    }
    async create(user, variable) {
        const userHasRight = await this.isAuthorizedForVariable(user, 'variable:create', variable.projectId);
        if (!userHasRight) {
            throw new errors_1.ForbiddenError(`You are not allowed to create a variable${variable.projectId ? ' in this project' : ''}`);
        }
        await this.canCreateNewVariable();
        await this.validateUniqueVariable(variable.key, variable.projectId);
        const saveResult = await this.variablesRepository.save({
            ...variable,
            project: variable.projectId ? { id: variable.projectId } : null,
            id: (0, db_1.generateNanoId)(),
        }, { transaction: false });
        this.eventService.emit('variable-created', {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            variableId: saveResult.id,
            variableKey: saveResult.key,
            ...(variable.projectId && { projectId: variable.projectId }),
        });
        await this.updateCache();
        return saveResult;
    }
    async update(user, id, variable) {
        const existingVariable = await this.getCached(id);
        if (!existingVariable) {
            throw new errors_1.NotFoundError(`Variable with id ${id} not found`);
        }
        const userHasRightOnExistingVariable = await this.isAuthorizedForVariable(user, 'variable:update', existingVariable?.project?.id);
        if (!userHasRightOnExistingVariable) {
            throw new errors_1.ForbiddenError('You are not allowed to update this variable');
        }
        const isChangingLegacyInvalidVariableKeyToNewInvalidOne = variable.key &&
            variable.key !== existingVariable.key &&
            !api_types_1.NEW_VARIABLE_KEY_REGEX.test(variable.key);
        if (isChangingLegacyInvalidVariableKeyToNewInvalidOne) {
            throw new variable_validation_error_1.VariableValidationError("When changing the variable key, it can only contain letters, numbers, and underscores (A-Za-z0-9_). Existing keys that don't follow this rule can be kept as-is for backwards-compatibility");
        }
        let newProjectId = existingVariable.project?.id;
        if (typeof variable.projectId !== 'undefined') {
            newProjectId = variable.projectId ?? undefined;
        }
        if (existingVariable?.project?.id !== newProjectId) {
            const userHasRightOnNewProject = await this.isAuthorizedForVariable(user, 'variable:update', newProjectId);
            if (!userHasRightOnNewProject) {
                throw new errors_1.ForbiddenError(`You are not allowed to move this variable to ${variable.projectId ? 'the specified project' : 'the global scope'}`);
            }
        }
        if (variable.key) {
            await this.validateUniqueVariable(variable.key, newProjectId, id);
        }
        await this.variablesRepository.update(id, {
            key: variable.key,
            value: variable.value,
            ...(typeof variable.projectId !== 'undefined'
                ? { project: variable.projectId ? { id: variable.projectId } : null }
                : {}),
        });
        this.eventService.emit('variable-updated', {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            variableId: id,
            variableKey: variable.key ?? existingVariable.key,
            ...(newProjectId && { projectId: newProjectId }),
        });
        await this.updateCache();
        return (await this.getCached(id));
    }
};
exports.VariablesService = VariablesService;
exports.VariablesService = VariablesService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.CacheService, db_1.VariablesRepository, backend_services_1.EventService, backend_common_1.LicenseState, project_service_ee_1.ProjectService])
], VariablesService);
//# sourceMappingURL=variables.service.ee.js.map