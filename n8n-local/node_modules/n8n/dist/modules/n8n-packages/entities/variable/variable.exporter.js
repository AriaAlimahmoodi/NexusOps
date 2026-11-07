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
exports.VariableExporter = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const variables_service_ee_1 = require("../../../../environments.ee/variables/variables.service.ee");
const variable_serializer_1 = require("./variable.serializer");
const manifest_entry_1 = require("../../io/manifest-entry");
const package_export_errors_1 = require("../package-export.errors");
const requirement_source_1 = require("../requirement-source");
function isBundleableVariable(variable) {
    return variable !== undefined;
}
let VariableExporter = class VariableExporter {
    constructor(variablesService, sharedWorkflowRepository, variableSerializer) {
        this.variablesService = variablesService;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.variableSerializer = variableSerializer;
    }
    async export(request) {
        if (request.requirements.length === 0) {
            return { entries: [], requirements: [] };
        }
        const workflowIds = [
            ...new Set(request.requirements.flatMap((r) => ('workflowId' in r ? [r.workflowId] : []))),
        ];
        const [allVariables, accessibleVariables, projectIdByWorkflowId] = await Promise.all([
            this.variablesService.getAllCached(),
            this.variablesService.getAllForUser(request.user),
            this.resolveWorkflowProjects(workflowIds),
        ]);
        const accessibleIds = new Set(accessibleVariables.map((variable) => variable.id));
        const resolvedNames = this.resolveRequirements(request.requirements, projectIdByWorkflowId, allVariables, accessibleIds);
        this.assertNoBundledVariableCollision(resolvedNames, request.projectTargetsById);
        const entries = [];
        const bundledVariableIds = new Set();
        const requirements = [];
        for (const { name, usedBy, variables } of resolvedNames) {
            for (const variable of variables) {
                if (!isBundleableVariable(variable))
                    continue;
                if (bundledVariableIds.has(variable.id))
                    continue;
                bundledVariableIds.add(variable.id);
                entries.push(await (0, manifest_entry_1.writeManifestEntry)(request.writer, 'variables', (0, manifest_entry_1.projectScopedDirectory)('variables', variable.project?.id, request.projectTargetsById), { id: variable.id, name: variable.key }, this.serializeOrBlock(variable, request.includeVariableValues)));
            }
            requirements.push({ name, usedBy });
        }
        return { entries, requirements };
    }
    serializeOrBlock(variable, includeValue) {
        try {
            return this.variableSerializer.serialize(variable, { includeValue });
        }
        catch (error) {
            if (!(error instanceof zod_1.ZodError))
                throw error;
            throw new package_export_errors_1.PackageExportBlockedError(`Variable "${variable.key}" does not match the expected format. Export aborted.`, {
                description: `${error.issues
                    .map((issue) => issue.message)
                    .join('; ')}. Fix the variable and retry the export.`,
            });
        }
    }
    resolveRequirements(requirements, projectIdByWorkflowId, allVariables, accessibleIds) {
        const variablesByKey = new Map();
        for (const variable of allVariables) {
            const bucket = variablesByKey.get(variable.key);
            if (bucket)
                bucket.push(variable);
            else
                variablesByKey.set(variable.key, [variable]);
        }
        const resolved = new Map();
        for (const requirement of requirements) {
            const projectId = 'workflowId' in requirement
                ? projectIdByWorkflowId.get(requirement.workflowId)
                : requirement.projectId;
            const name = requirement.variableName;
            const picked = (0, n8n_workflow_1.pickVariableForProject)(variablesByKey.get(name) ?? [], name, projectId);
            const entry = resolved.get(name) ?? {
                name,
                usedBy: [],
                variables: [],
            };
            (0, requirement_source_1.addRequirementUsage)(entry, requirement);
            entry.variables.push(picked && accessibleIds.has(picked.id) ? picked : undefined);
            resolved.set(name, entry);
        }
        return [...resolved.values()];
    }
    async resolveWorkflowProjects(workflowIds) {
        if (workflowIds.length === 0)
            return new Map();
        const owners = await this.sharedWorkflowRepository.findOwnerProjectsByWorkflowIds(workflowIds);
        return new Map([...owners].map(([workflowId, project]) => [workflowId, project.id]));
    }
    assertNoBundledVariableCollision(resolvedNames, projectTargetsById) {
        const conflictingNames = resolvedNames
            .filter(({ variables }) => this.hasDirectoryCollision(variables, projectTargetsById))
            .map(({ name }) => name);
        if (conflictingNames.length === 0)
            return;
        const displayedNames = conflictingNames.slice(0, 20);
        const omittedCount = conflictingNames.length - displayedNames.length;
        throw new package_export_errors_1.PackageExportBlockedError(`${conflictingNames.length} variable name(s) resolve to different variables that would collide in the package. Export aborted.`, {
            description: `Conflicting variable name(s): ${displayedNames.join(', ')}${omittedCount > 0 ? `, and ${omittedCount} more` : ''}. Export the projects as a project package instead.`,
        });
    }
    hasDirectoryCollision(variables, projectTargetsById) {
        const idByDir = new Map();
        for (const variable of variables) {
            if (!isBundleableVariable(variable))
                continue;
            const dir = (0, manifest_entry_1.projectScopedDirectory)('variables', variable.project?.id, projectTargetsById);
            const previousId = idByDir.get(dir);
            if (previousId !== undefined && previousId !== variable.id)
                return true;
            idByDir.set(dir, variable.id);
        }
        return false;
    }
};
exports.VariableExporter = VariableExporter;
exports.VariableExporter = VariableExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [variables_service_ee_1.VariablesService, db_1.SharedWorkflowRepository, variable_serializer_1.VariableSerializer])
], VariableExporter);
//# sourceMappingURL=variable.exporter.js.map