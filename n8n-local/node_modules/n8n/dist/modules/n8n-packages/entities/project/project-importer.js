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
exports.ProjectImporter = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const project_service_ee_1 = require("../../../../services/project.service.ee");
const project_conflict_policy_1 = require("./project-conflict-policy");
let ProjectImporter = class ProjectImporter {
    constructor(projectService, licenseState) {
        this.projectService = projectService;
        this.licenseState = licenseState;
    }
    async plan(user, projects, policy) {
        const items = [];
        const conflicts = [];
        const decision = (0, project_conflict_policy_1.decideMatchedProject)(policy);
        for (const project of projects) {
            const existing = await this.projectService.findProject(project.sourceProjectId);
            if (existing) {
                if (existing.type !== 'team') {
                    throw new errors_1.ForbiddenError(`Cannot import project "${project.name}": its id belongs to a non-team project on this instance.`);
                }
                const authorized = await this.projectService.getProjectWithScope(user, existing.id, [
                    'project:update',
                ]);
                if (!authorized) {
                    throw new errors_1.ForbiddenError(`You do not have permission to update the existing project "${project.name}".`);
                }
                if (decision.blocked) {
                    conflicts.push({
                        kind: 'fail-policy',
                        sourceProjectId: project.sourceProjectId,
                        name: project.name,
                    });
                    continue;
                }
                items.push(decision.action === 'update'
                    ? { action: 'update', ...toFields(project) }
                    : { action: 'skip', existingName: existing.name, ...toFields(project) });
            }
            else {
                this.assertCanCreateProjects(user);
                items.push({ action: 'create', ...toFields(project) });
            }
        }
        return { items, conflicts };
    }
    async apply(user, items) {
        const summaries = [];
        for (const item of items) {
            switch (item.action) {
                case 'skip':
                    summaries.push({
                        sourceProjectId: item.sourceProjectId,
                        localId: item.sourceProjectId,
                        name: item.existingName,
                        status: 'skipped',
                    });
                    break;
                case 'create': {
                    const project = await this.projectService.createTeamProject(user, { name: item.name, icon: item.icon }, {
                        id: item.sourceProjectId,
                        description: item.description ?? null,
                        customTelemetryTags: item.customTelemetryTags,
                    });
                    summaries.push({
                        sourceProjectId: item.sourceProjectId,
                        localId: project.id,
                        name: project.name,
                        status: 'created',
                    });
                    break;
                }
                case 'update':
                    await this.projectService.updateProject(user, item.sourceProjectId, {
                        name: item.name,
                        icon: item.icon,
                        description: item.description,
                        customTelemetryTags: item.customTelemetryTags,
                    }, { preserveCustomTelemetryTags: true });
                    summaries.push({
                        sourceProjectId: item.sourceProjectId,
                        localId: item.sourceProjectId,
                        name: item.name,
                        status: 'updated',
                    });
                    break;
                default: {
                    const unhandled = item;
                    throw new n8n_workflow_1.UnexpectedError(`Unhandled project import action: ${JSON.stringify(unhandled)}`);
                }
            }
        }
        return summaries;
    }
    assertCanCreateProjects(user) {
        if (!(0, permissions_1.hasGlobalScope)(user, 'project:create')) {
            throw new errors_1.ForbiddenError('You do not have permission to create projects.');
        }
        if (!this.licenseState.isLicensed('feat:projectRole:admin')) {
            throw new errors_1.ForbiddenError('Your license does not allow creating team projects. Project import requires a license that supports team projects.');
        }
    }
};
exports.ProjectImporter = ProjectImporter;
exports.ProjectImporter = ProjectImporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [project_service_ee_1.ProjectService, backend_common_1.LicenseState])
], ProjectImporter);
function toFields(project) {
    return {
        sourceProjectId: project.sourceProjectId,
        name: project.name,
        ...(project.description !== undefined ? { description: project.description } : {}),
        ...(project.icon !== undefined ? { icon: project.icon } : {}),
        ...(project.customTelemetryTags !== undefined
            ? { customTelemetryTags: project.customTelemetryTags }
            : {}),
    };
}
//# sourceMappingURL=project-importer.js.map