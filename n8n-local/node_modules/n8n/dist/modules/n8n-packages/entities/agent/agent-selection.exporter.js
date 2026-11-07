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
exports.AgentSelectionExporter = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const project_service_ee_1 = require("../../../../services/project.service.ee");
const agent_requirements_extractor_1 = require("./agent-requirements.extractor");
const n8n_packages_types_1 = require("../../n8n-packages.types");
const package_export_errors_1 = require("../package-export.errors");
const project_export_access_1 = require("../project/project-export-access");
const project_shell_exporter_1 = require("../project/project-shell.exporter");
const requirement_source_1 = require("../requirement-source");
const requirements_types_1 = require("../requirements.types");
const workflow_version_policy_1 = require("../workflow/workflow-version-policy");
let AgentSelectionExporter = class AgentSelectionExporter {
    constructor(moduleRegistry, projectScopeService, projectService, projectShellExporter, requirementsExtractor) {
        this.moduleRegistry = moduleRegistry;
        this.projectScopeService = projectScopeService;
        this.projectService = projectService;
        this.projectShellExporter = projectShellExporter;
        this.requirementsExtractor = requirementsExtractor;
    }
    async export(request) {
        const result = {
            agentEntries: [],
            projectEntries: [],
            projectTargetsById: new Map(request.projectTargetsById),
            requirements: (0, requirements_types_1.mergeRequirements)(),
            workflowRequirements: [],
            agentRequirements: [],
            agentIds: [],
            counts: { agents: 0 },
        };
        const projectIds = request.projectIds ?? [];
        const agentIds = request.agentIds ?? [];
        if (agentIds.length === 0 &&
            (projectIds.length === 0 || request.projectWorkflowIds !== undefined)) {
            return result;
        }
        if (!this.moduleRegistry.isActive('agents')) {
            if (agentIds.length > 0) {
                throw new package_export_errors_1.PackageExportBlockedError('Agents cannot be exported because the agents module is disabled.');
            }
            return result;
        }
        const selectedProjects = await (0, project_export_access_1.findExportableProjects)(this.projectService, request.user, projectIds.filter((id) => !result.projectTargetsById.has(id)));
        const { AgentRepository } = await import('../../../../modules/agents/repositories/agent.repository.js');
        const { AgentExporter } = await import('./agent.exporter.js');
        const exporter = di_1.Container.get(AgentExporter);
        const prepared = await this.prepareSelection(request, di_1.Container.get(AgentRepository), exporter);
        this.assertAgentDependenciesIncluded(request, prepared);
        if (projectIds.length > 0) {
            await this.addProjectShells(request, prepared, result, selectedProjects);
        }
        for (const { snapshot } of prepared) {
            const prefix = projectIds.length > 0 ? result.projectTargetsById.get(snapshot.projectId) : '';
            result.agentEntries.push(await exporter.write(snapshot, request.writer, prefix));
        }
        result.requirements = (0, requirements_types_1.mergeRequirements)(...prepared.map(({ requirements }) => requirements));
        result.workflowRequirements = prepared.flatMap(({ requirements }) => requirements.workflows);
        result.agentRequirements = this.collectAgentRequirements(prepared);
        result.agentIds = result.agentEntries.map(({ id }) => id);
        result.counts.agents = result.agentEntries.length;
        return result;
    }
    async prepareSelection(request, repository, exporter) {
        const projectIds = request.projectIds ?? [];
        const projectAgentIds = await repository.findIdsInProjectsForExport(projectIds);
        const pending = [...new Set([...(request.agentIds ?? []), ...projectAgentIds])];
        const seen = new Set(pending);
        const prepared = [];
        const exportableProjects = await this.projectScopeService.getProjectIds(request.user, [
            'agent:export',
        ]);
        const policy = request.versionPolicy ?? n8n_packages_types_1.ExportVersionPolicy.Latest;
        while (pending.length > 0) {
            const ids = pending.splice(0);
            const agents = await repository.findForExport(ids, exportableProjects, {
                includeActiveVersion: (0, workflow_version_policy_1.needsActiveVersion)(policy),
            });
            await (0, package_export_errors_1.assertEveryRequestedEntityAccessible)('Agent', ids, agents, async (missingIds) => await repository.findExistingIds(missingIds));
            const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
            for (const id of ids) {
                const agent = agentsById.get(id);
                if (!agent)
                    continue;
                const snapshot = await exporter.prepare(agent, policy);
                if (!snapshot)
                    continue;
                const requirements = this.requirementsExtractor.extract(snapshot, projectIds.length > 0 ? 'project' : 'top-level');
                prepared.push({ snapshot, requirements });
                if (request.dependencyPolicy !== n8n_packages_types_1.ExportDependencyPolicy.IncludeInPackage)
                    continue;
                this.enqueueDependencies(requirements.agentIds, seen, pending);
            }
        }
        return prepared;
    }
    enqueueDependencies(ids, seen, pending) {
        for (const id of ids) {
            if (seen.has(id))
                continue;
            seen.add(id);
            pending.push(id);
        }
    }
    assertAgentDependenciesIncluded(request, prepared) {
        if (request.dependencyPolicy === n8n_packages_types_1.ExportDependencyPolicy.ReferenceOnly)
            return;
        const included = new Set(prepared.map(({ snapshot }) => snapshot.content.id));
        for (const { snapshot, requirements } of prepared) {
            const missing = requirements.agentIds.filter((id) => !included.has(id));
            if (missing.length === 0)
                continue;
            throw new package_export_errors_1.PackageExportBlockedError(`Agent "${snapshot.content.id}" has Agent dependencies not included in the package. Export aborted.`, {
                description: `Agent IDs not included in the package: ${missing.slice(0, 20).join(', ')}`,
            });
        }
    }
    async addProjectShells(request, prepared, result, selectedProjects) {
        const projectIds = new Set(prepared
            .map(({ snapshot }) => snapshot.projectId)
            .filter((id) => !result.projectTargetsById.has(id)));
        if (projectIds.size === 0)
            return;
        const selectedProjectIds = new Set(selectedProjects.map(({ id }) => id));
        const dependencyProjects = await (0, project_export_access_1.findExportableProjects)(this.projectService, request.user, [...projectIds].filter((id) => !selectedProjectIds.has(id)));
        const context = {
            writer: request.writer,
            projectEntries: result.projectEntries,
            projectTargetsById: result.projectTargetsById,
        };
        for (const project of [...selectedProjects, ...dependencyProjects]) {
            if (projectIds.has(project.id))
                await this.projectShellExporter.export(project, context);
        }
    }
    collectAgentRequirements(prepared) {
        const names = new Map(prepared.map(({ snapshot }) => [snapshot.content.id, snapshot.content.name]));
        const byId = new Map();
        for (const { snapshot, requirements } of prepared) {
            for (const id of requirements.agentIds) {
                const requirement = byId.get(id) ?? {
                    id,
                    ...(names.has(id) ? { name: names.get(id) } : {}),
                    usedBy: [],
                };
                (0, requirement_source_1.addRequirementUsage)(requirement, {
                    agentId: snapshot.content.id,
                    projectId: snapshot.projectId,
                });
                byId.set(id, requirement);
            }
        }
        return [...byId.values()];
    }
};
exports.AgentSelectionExporter = AgentSelectionExporter;
exports.AgentSelectionExporter = AgentSelectionExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.ModuleRegistry, backend_services_1.ProjectScopeService, project_service_ee_1.ProjectService, project_shell_exporter_1.ProjectShellExporter, agent_requirements_extractor_1.AgentRequirementsExtractor])
], AgentSelectionExporter);
//# sourceMappingURL=agent-selection.exporter.js.map