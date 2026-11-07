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
exports.SourceControlScopedService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const errors_1 = require("@n8n/errors");
const source_control_context_factory_1 = require("./source-control-context.factory");
let SourceControlScopedService = class SourceControlScopedService {
    constructor(sourceControlContextFactory, workflowRepository) {
        this.sourceControlContextFactory = sourceControlContextFactory;
        this.workflowRepository = workflowRepository;
    }
    async ensureIsAllowedToPush(req) {
        if ((0, permissions_1.hasGlobalScope)(req.user, 'sourceControl:push')) {
            return;
        }
        const ctx = await this.sourceControlContextFactory.createContext(req.user);
        if (ctx.authorizedProjects.length === 0) {
            throw new errors_1.ForbiddenError('You are not allowed to push changes');
        }
    }
    async ensureIsAllowedToGetStatus(req) {
        if ((0, permissions_1.hasGlobalScope)(req.user, ['sourceControl:pull', 'sourceControl:push', 'sourceControl:manage'])) {
            return;
        }
        const ctx = await this.sourceControlContextFactory.createContext(req.user);
        if (ctx.authorizedProjects.length === 0) {
            throw new errors_1.ForbiddenError('You do not have permission to read source control status');
        }
    }
    async getWorkflowsInAdminProjectsFromContext(context, id) {
        if (context.hasAccessToAllProjects()) {
            return;
        }
        if (id) {
            const where = this.getWorkflowsInAdminProjectsFromContextFilter(context);
            where.id = id;
            return await this.workflowRepository.find({ select: { id: true }, where });
        }
        return context.accessibleWorkflowIds.map((wfId) => ({ id: wfId }));
    }
    getProjectsWithPushScopeByContextFilter(context) {
        if (context.hasAccessToAllProjects()) {
            return;
        }
        return {
            type: 'team',
            projectRelations: {
                role: {
                    scopes: {
                        slug: 'sourceControl:push',
                    },
                },
                userId: context.user.id,
            },
        };
    }
    getFoldersInAdminProjectsFromContextFilter(context) {
        if (context.hasAccessToAllProjects()) {
            return {};
        }
        return {
            homeProject: this.getProjectsWithPushScopeByContextFilter(context),
        };
    }
    getWorkflowsInAdminProjectsFromContextFilter(context) {
        if (context.hasAccessToAllProjects()) {
            return {};
        }
        return {
            shared: {
                role: 'workflow:owner',
                project: this.getProjectsWithPushScopeByContextFilter(context),
            },
        };
    }
    getCredentialsInAdminProjectsFromContextFilter(context) {
        if (context.hasAccessToAllProjects()) {
            return { usageScope: 'project' };
        }
        return {
            shared: {
                role: 'credential:owner',
                project: this.getProjectsWithPushScopeByContextFilter(context),
            },
        };
    }
    getWorkflowTagMappingInAdminProjectsFromContextFilter(context) {
        if (context.hasAccessToAllProjects()) {
            return {};
        }
        return {
            workflows: this.getWorkflowsInAdminProjectsFromContextFilter(context),
        };
    }
    getDataTablesInAdminProjectsFromContextFilter(context) {
        if (context.hasAccessToAllProjects()) {
            return {};
        }
        return {
            project: this.getProjectsWithPushScopeByContextFilter(context),
        };
    }
};
exports.SourceControlScopedService = SourceControlScopedService;
exports.SourceControlScopedService = SourceControlScopedService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [source_control_context_factory_1.SourceControlContextFactory, db_1.WorkflowRepository])
], SourceControlScopedService);
//# sourceMappingURL=source-control-scoped.service.js.map