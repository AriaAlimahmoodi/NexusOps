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
exports.SourceControlContextFactory = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const source_control_context_1 = require("./types/source-control-context");
let SourceControlContextFactory = class SourceControlContextFactory {
    constructor(projectRepository, workflowRepository) {
        this.projectRepository = projectRepository;
        this.workflowRepository = workflowRepository;
    }
    async createContext(user) {
        if ((0, permissions_1.hasGlobalScope)(user, 'project:update')) {
            return new source_control_context_1.SourceControlContext(user, await this.fetchAllProjects(), []);
        }
        const [authorizedProjects, accessibleWorkflowIds] = await Promise.all([
            this.fetchAuthorizedProjects(user),
            this.fetchAccessibleWorkflowIds(user),
        ]);
        return new source_control_context_1.SourceControlContext(user, authorizedProjects, accessibleWorkflowIds);
    }
    async fetchAllProjects() {
        const projects = await this.projectRepository.find();
        const personalProjects = projects.filter((p) => p.type === 'personal');
        if (personalProjects.length > 0) {
            const personalProjectIds = personalProjects.map((p) => p.id);
            const ownerRelations = await this.projectRepository
                .createQueryBuilder('project')
                .leftJoinAndSelect('project.projectRelations', 'pr', 'pr.role = :ownerRole', {
                ownerRole: 'project:personalOwner',
            })
                .leftJoinAndSelect('pr.role', 'role')
                .leftJoinAndSelect('pr.user', 'user')
                .where('project.id IN (:...ids)', { ids: personalProjectIds })
                .select(['project.id', 'pr.userId', 'pr.projectId', 'role.slug', 'user.email'])
                .getMany();
            const relationsById = new Map(ownerRelations.map((p) => [p.id, p.projectRelations]));
            for (const project of personalProjects) {
                project.projectRelations = relationsById.get(project.id) ?? [];
            }
        }
        for (const project of projects) {
            if (project.type === 'team') {
                project.projectRelations = [];
            }
        }
        return projects;
    }
    async fetchAuthorizedProjects(user) {
        const projectEntities = await this.projectRepository
            .createQueryBuilder('project')
            .innerJoin('project.projectRelations', 'pr', 'pr.userId = :userId', {
            userId: user.id,
        })
            .innerJoin('pr.role', 'role')
            .innerJoin('role.scopes', 'scope', 'scope.slug = :scope', {
            scope: 'sourceControl:push',
        })
            .where('project.type = :type', { type: 'team' })
            .select(['project.id'])
            .getMany();
        if (projectEntities.length === 0)
            return [];
        const ids = projectEntities.map((p) => p.id);
        const projects = await this.projectRepository.find({
            select: { id: true, name: true, type: true },
            where: { id: (0, typeorm_1.In)(ids) },
        });
        for (const project of projects) {
            project.projectRelations = [];
        }
        return projects;
    }
    async fetchAccessibleWorkflowIds(user) {
        const where = {
            shared: {
                role: 'workflow:owner',
                project: {
                    type: 'team',
                    projectRelations: {
                        role: {
                            scopes: {
                                slug: 'sourceControl:push',
                            },
                        },
                        userId: user.id,
                    },
                },
            },
        };
        const workflows = await this.workflowRepository.find({ select: { id: true }, where });
        return workflows.map((w) => w.id);
    }
};
exports.SourceControlContextFactory = SourceControlContextFactory;
exports.SourceControlContextFactory = SourceControlContextFactory = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ProjectRepository, db_1.WorkflowRepository])
], SourceControlContextFactory);
//# sourceMappingURL=source-control-context.factory.js.map