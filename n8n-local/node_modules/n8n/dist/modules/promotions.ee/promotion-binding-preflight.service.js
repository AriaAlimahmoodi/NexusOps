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
exports.PromotionBindingPreflightService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const credential_types_1 = require("../../credential-types");
const workflow_credential_references_1 = require("../../modules/n8n-packages/entities/credential/workflow-credential-references");
const data_table_importer_1 = require("../../modules/n8n-packages/entities/data-table/data-table-importer");
const data_table_requirements_extractor_1 = require("../../modules/n8n-packages/entities/data-table/data-table-requirements.extractor");
const variable_requirements_extractor_1 = require("../../modules/n8n-packages/entities/variable/variable-requirements.extractor");
const directory_package_reader_1 = require("../../modules/n8n-packages/io/directory/directory-package-reader");
const package_directory_inventory_reader_1 = require("../../modules/n8n-packages/io/directory/package-directory-inventory-reader");
const manifest_entry_1 = require("../../modules/n8n-packages/io/manifest-entry");
const n8n_packages_config_1 = require("../../modules/n8n-packages/n8n-packages.config");
let PromotionBindingPreflightService = class PromotionBindingPreflightService {
    constructor(packageImportConfig, inventoryReader, variableExtractor, dataTableExtractor, dataTableImporter, credentialTypes, credentialsRepository, variablesRepository, projectRepository) {
        this.packageImportConfig = packageImportConfig;
        this.inventoryReader = inventoryReader;
        this.variableExtractor = variableExtractor;
        this.dataTableExtractor = dataTableExtractor;
        this.dataTableImporter = dataTableImporter;
        this.credentialTypes = credentialTypes;
        this.credentialsRepository = credentialsRepository;
        this.variablesRepository = variablesRepository;
        this.projectRepository = projectRepository;
    }
    async checkDirectory({ sourceDir, selection, }) {
        const reader = new directory_package_reader_1.DirectoryPackageReader(sourceDir, this.packageImportConfig);
        const inventory = await this.inventoryReader.read(reader);
        return await this.checkInventory({ inventory, selection });
    }
    async checkInventory({ inventory: packageInventory, selection, }) {
        const inventory = selection
            ? {
                ...packageInventory,
                projects: packageInventory.projects.filter(({ id }) => id === selection.selectedProjectId),
                workflows: packageInventory.workflows.filter(({ id, projectId }) => projectId === selection.selectedProjectId &&
                    selection.selectedWorkflowIds.includes(id)),
            }
            : packageInventory;
        const credentials = collectCredentialReferences(inventory);
        const variables = collectVariableReferences(inventory, this.variableExtractor);
        const dataTables = collectDataTableReferences(inventory, this.dataTableExtractor);
        const projects = new Map(packageInventory.projects.map(({ id, name }) => [id, { id, name }]));
        const projectOf = (id) => {
            const project = projects.get(id);
            if (!project)
                throw new n8n_workflow_1.UnexpectedError(`Package inventory has no project "${id}"`);
            return project;
        };
        const [targetProjects, targetCredentials, targetVariables, destructiveChanges] = await Promise.all([
            this.projectRepository.findTypesByIds([...projects.keys()]),
            this.credentialsRepository.findPromotionBindingAccess(credentials.flatMap(({ sourceId }) => sourceId ?? []), unique(credentials.flatMap(({ workflows }) => workflows.map(({ projectId }) => projectId)))),
            this.variablesRepository.findKeysInProjectsOrGlobal(unique(variables.map(({ name }) => name)), unique(variables.flatMap(({ workflows }) => workflows.map(({ projectId }) => projectId)))),
            this.dataTableImporter.findDestructiveChanges(dataTables, inventory.dataTables.map(({ dataTable }) => dataTable)),
        ]);
        const targetProjectIds = new Set(targetProjects.map(({ id }) => id));
        const result = {
            missingProjects: inventory.projects
                .filter(({ id }) => !targetProjectIds.has(id))
                .sort((a, b) => compare(a.id, b.id))
                .map(({ id, name, icon, description, customTelemetryTags }) => ({
                id,
                name,
                ...(icon !== undefined ? { icon } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(customTelemetryTags !== undefined ? { customTelemetryTags } : {}),
            })),
            missingBindings: [],
            accessRequirements: [],
            conflicts: [],
            warnings: [],
        };
        const personalProjectIds = new Set(targetProjects.filter(({ type }) => type === 'personal').map(({ id }) => id));
        this.checkProjects(inventory, personalProjectIds, projectOf, result);
        this.checkCredentials(credentials, targetCredentials, personalProjectIds, projectOf, result);
        this.checkVariables(variables, targetVariables, personalProjectIds, projectOf, result);
        this.checkDataTables(destructiveChanges, projectOf, result);
        if (!selection)
            await this.checkProjectDeletions(packageInventory, result);
        return result;
    }
    async checkProjectDeletions(inventory, result) {
        const packageProjectIds = new Set(inventory.projects.map(({ id }) => id));
        const deletedIds = (await this.projectRepository.findTeamProjectIds()).filter((id) => !packageProjectIds.has(id));
        if (deletedIds.length === 0)
            return;
        const projects = await this.projectRepository.findTeamProjectInfoByIds(deletedIds);
        for (const { id, name } of projects.sort((a, b) => compare(a.name, b.name) || compare(a.id, b.id))) {
            result.conflicts.push({ kind: 'project', code: 'project-deletion', project: { id, name } });
        }
    }
    checkProjects(inventory, personalProjectIds, projectOf, result) {
        for (const project of [...inventory.projects].sort((a, b) => compare(a.id, b.id))) {
            if (!personalProjectIds.has(project.id))
                continue;
            result.conflicts.push({
                kind: 'project',
                code: 'project-not-team',
                project: projectOf(project.id),
                filePath: `${project.path}/${manifest_entry_1.PACKAGE_ENTITY_LAYOUT.projects.fileName}`,
                workflows: workflowRefs(inventory.workflows.filter(({ projectId }) => projectId === project.id)),
            });
        }
    }
    checkCredentials(credentials, targetCredentials, personalProjectIds, projectOf, result) {
        const credentialsById = new Map(targetCredentials.map((credential) => [credential.id, credential]));
        for (const reference of credentials) {
            const { sourceId, name, expectedTypes, file, workflows } = reference;
            const consumers = consumersOf(workflows, projectOf);
            const conflict = {
                kind: 'credential',
                sourceId,
                name,
                expectedTypes,
                consumers,
                ...(file ? { filePath: file.path } : {}),
                referenceFiles: referenceFiles(workflows),
            };
            const credentialType = expectedTypes[0];
            if (sourceId === null) {
                result.conflicts.push({ ...conflict, code: 'missing-id' });
                continue;
            }
            if (expectedTypes.length > 1) {
                result.conflicts.push({ ...conflict, code: 'conflicting-types' });
                continue;
            }
            if (!this.credentialTypes.recognizes(credentialType)) {
                result.conflicts.push({ ...conflict, code: 'unknown-type' });
                continue;
            }
            const target = credentialsById.get(sourceId);
            const binding = { kind: 'credential', sourceId, name, credentialType, consumers };
            if (target) {
                if (target.type !== credentialType) {
                    result.conflicts.push({ ...conflict, code: 'type-mismatch', targetType: target.type });
                }
                else if (target.usageScope !== 'project') {
                    result.conflicts.push({
                        ...conflict,
                        code: 'incompatible-usage-scope',
                        usageScope: target.usageScope,
                    });
                }
                else if (!target.isGlobal) {
                    const accessibleProjects = new Set(target.projectIds);
                    const needsAccess = consumers.filter(({ project }) => !accessibleProjects.has(project.id) && !personalProjectIds.has(project.id));
                    if (needsAccess.length > 0) {
                        result.accessRequirements.push({
                            ...binding,
                            code: 'access-required',
                            consumers: needsAccess,
                        });
                    }
                }
            }
            else if (!file || file.projectId === null) {
                result.conflicts.push({ ...conflict, code: 'unknown-owner' });
            }
            else if (!personalProjectIds.has(file.projectId)) {
                result.missingBindings.push({
                    ...binding,
                    ownerProject: projectOf(file.projectId),
                    ...(file.credential.data !== undefined ? { expressionData: file.credential.data } : {}),
                });
            }
        }
    }
    checkVariables(variables, targetVariables, personalProjectIds, projectOf, result) {
        const existingVariables = new Set(targetVariables.map(({ key, projectId }) => variableKey(key, projectId)));
        for (const { name, file, workflows } of variables) {
            const consumers = consumersOf(workflows, projectOf);
            if (!file) {
                result.conflicts.push({
                    kind: 'variable',
                    code: 'missing-definition',
                    name,
                    consumers,
                    referenceFiles: referenceFiles(workflows),
                });
                continue;
            }
            const scope = file.projectId === null
                ? { kind: 'global' }
                : { kind: 'project', project: projectOf(file.projectId) };
            if (!existingVariables.has(variableKey(name, file.projectId)) &&
                (file.projectId === null || !personalProjectIds.has(file.projectId))) {
                result.missingBindings.push({
                    kind: 'variable',
                    name,
                    variableType: file.variable.type,
                    scope,
                    consumers,
                    ...(file.variable.value !== undefined ? { sourceValue: file.variable.value } : {}),
                });
            }
            if (file.projectId === null) {
                const shadowed = consumers.filter(({ project }) => existingVariables.has(variableKey(name, project.id)));
                if (shadowed.length > 0) {
                    result.warnings.push({
                        kind: 'variable',
                        code: 'variable-shadowed',
                        name,
                        scope: { kind: 'global' },
                        consumers: shadowed,
                    });
                }
            }
        }
    }
    checkDataTables(destructiveChanges, projectOf, result) {
        for (const { table, operations, reference } of destructiveChanges) {
            result.conflicts.push({
                kind: 'data-table',
                code: 'destructive-change',
                id: table.id,
                name: table.name,
                consumers: consumersOf(reference.workflows, projectOf),
                changes: operations,
            });
        }
    }
};
exports.PromotionBindingPreflightService = PromotionBindingPreflightService;
exports.PromotionBindingPreflightService = PromotionBindingPreflightService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_packages_config_1.PackageImportConfig, package_directory_inventory_reader_1.PackageDirectoryInventoryReader, variable_requirements_extractor_1.VariableRequirementsExtractor, data_table_requirements_extractor_1.DataTableRequirementsExtractor, data_table_importer_1.DataTableImporter, credential_types_1.CredentialTypes, db_1.CredentialsRepository, db_1.VariablesRepository, db_1.ProjectRepository])
], PromotionBindingPreflightService);
function collectCredentialReferences(inventory) {
    const groups = new Map();
    const files = new Map(inventory.credentials.map((file) => [file.credential.id, file]));
    for (const workflow of inventory.workflows) {
        (0, workflow_credential_references_1.visitWorkflowCredentials)(workflow.content.nodes, (type, details) => {
            if (!details.id && details.__aiGatewayManaged === true)
                return false;
            const sourceId = details.id || null;
            const key = JSON.stringify(sourceId ?? [type, details.name]);
            const file = sourceId === null ? undefined : files.get(sourceId);
            const group = groups.get(key) ?? {
                sourceId,
                name: file?.credential.name ?? details.name,
                expectedTypes: file ? [file.credential.type] : [],
                file,
                workflows: [],
            };
            group.expectedTypes.push(type);
            group.workflows.push(workflow);
            groups.set(key, group);
            return false;
        });
    }
    for (const group of groups.values()) {
        group.expectedTypes = unique(group.expectedTypes).sort(compare);
    }
    return [...groups.values()].sort((a, b) => compare(a.sourceId ?? '', b.sourceId ?? '') ||
        compare(a.expectedTypes[0], b.expectedTypes[0]) ||
        compare(a.name, b.name));
}
function collectVariableReferences(inventory, extractor) {
    const files = new Map(inventory.variables.map((file) => [variableKey(file.variable.name, file.projectId), file]));
    const groups = new Map();
    for (const workflow of inventory.workflows) {
        const requirements = extractor.extract({
            id: workflow.id,
            nodes: workflow.content.nodes,
            settings: workflow.content.settings,
        });
        for (const { variableName: name } of requirements) {
            const file = files.get(variableKey(name, workflow.projectId)) ?? files.get(variableKey(name, null));
            const key = JSON.stringify([file ? 'defined' : 'missing', file?.projectId, name]);
            const group = groups.get(key) ?? { name, file, workflows: [] };
            group.workflows.push(workflow);
            groups.set(key, group);
        }
    }
    return [...groups.values()].sort((a, b) => compare(a.file?.projectId ?? '', b.file?.projectId ?? '') || compare(a.name, b.name));
}
function collectDataTableReferences(inventory, extractor) {
    const groups = new Map();
    for (const workflow of inventory.workflows) {
        const requirements = extractor.extract({ id: workflow.id, nodes: workflow.content.nodes });
        for (const { dataTableId: id } of requirements) {
            const key = JSON.stringify([workflow.projectId, id]);
            const group = groups.get(key) ?? { id, projectId: workflow.projectId, workflows: [] };
            group.workflows.push(workflow);
            groups.set(key, group);
        }
    }
    return [...groups.values()].sort((a, b) => compare(a.id, b.id));
}
function consumersOf(workflows, projectOf) {
    const byProject = new Map();
    for (const workflow of workflows) {
        const group = byProject.get(workflow.projectId) ?? [];
        group.push(workflow);
        byProject.set(workflow.projectId, group);
    }
    return [...byProject.entries()]
        .sort(([a], [b]) => compare(a, b))
        .map(([projectId, uses]) => ({ project: projectOf(projectId), workflows: workflowRefs(uses) }));
}
function workflowRefs(workflows) {
    return [...new Map(workflows.map((workflow) => [workflow.id, workflow])).values()]
        .sort((a, b) => compare(a.id, b.id))
        .map(({ id, name }) => ({ id, name }));
}
function referenceFiles(workflows) {
    return unique(workflows.map(({ path }) => path)).sort(compare);
}
function variableKey(name, projectId) {
    return JSON.stringify([projectId, name]);
}
function unique(values) {
    return [...new Set(values)];
}
function compare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
//# sourceMappingURL=promotion-binding-preflight.service.js.map