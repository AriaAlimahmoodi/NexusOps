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
exports.PromotionChangeService = void 0;
exports.scopeManifestToProject = scopeManifestToProject;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const errors_1 = require("@n8n/errors");
const hashing_package_writer_1 = require("../../modules/n8n-packages/io/hashing-package-writer");
const manifest_entry_1 = require("../../modules/n8n-packages/io/manifest-entry");
const slug_utils_1 = require("../../modules/n8n-packages/io/slug.utils");
const n8n_packages_service_1 = require("../../modules/n8n-packages/n8n-packages.service");
const n8n_packages_types_1 = require("../../modules/n8n-packages/n8n-packages.types");
const constants_1 = require("../../modules/n8n-packages/spec/constants");
const manifest_schema_1 = require("../../modules/n8n-packages/spec/manifest.schema");
const requirement_consumers_1 = require("../../modules/n8n-packages/spec/requirement-consumers");
const base_branch_files_1 = require("./base-branch-files");
const constants_2 = require("./constants");
const diff_package_files_1 = require("./diff-package-files");
const promotions_service_1 = require("./promotions.service");
const DEPENDENCY_COLLECTIONS = {
    credentials: 'credentials',
    dataTables: 'dataTables',
    variables: 'variables',
    tags: 'tags',
    workflows: 'workflows',
    nodeTypes: null,
};
const GIT_SCOPES = {
    promote: 'gitConnection:push',
    apply: 'gitConnection:pull',
};
let PromotionChangeService = class PromotionChangeService {
    constructor(promotionsService, packagesService, workflowRepository, variablesRepository, logger) {
        this.promotionsService = promotionsService;
        this.packagesService = packagesService;
        this.workflowRepository = workflowRepository;
        this.variablesRepository = variablesRepository;
        this.logger = logger;
        this.logger = this.logger.scoped('promotions');
    }
    async getChanges(user, projectId, direction, query) {
        this.assertCanPreview(user, direction);
        const branch = await this.promotionsService.readBranchPackage(projectId, direction);
        const branchDesired = direction === 'apply' ? await this.readBranchDesired(branch, projectId) : null;
        const [instance, destinationVariables] = await Promise.all([
            this.exportInstancePackage(user, projectId),
            branchDesired === null
                ? null
                : this.variablesRepository.findKeysInProjectsOrGlobal(branchDesired.manifest.requirements?.variables?.map(({ name }) => name) ?? [], [projectId]),
        ]);
        const { base, desired } = branchDesired === null
            ? { base: branch.files, desired: instance }
            : { base: instance.files, desired: branchDesired };
        const diff = this.diffPackages({ projectId, direction, base, desired, destinationVariables });
        const archiveState = direction === 'promote'
            ? instance.archiveState
            : await readBranchArchiveState(branch, diff.archiveCheckPaths);
        const metadata = await this.workflowRepository.findByIds([...diff.changedIds].filter((id) => direction === 'apply' || diff.desiredWorkflows.has(id)), { fields: ['name', 'updatedAt', 'versionCounter'] });
        const rows = buildPromotableResources({ ...diff, base, archiveState, metadata });
        return {
            commitSha: branch.commitSha,
            source: { configId: branch.configId, branchName: branch.branchName },
            changes: applyQuery(rows, query),
        };
    }
    assertCanPreview(user, direction) {
        if (!(0, permissions_1.hasGlobalScope)(user, GIT_SCOPES[direction])) {
            const operation = direction === 'promote' ? 'push' : 'pull';
            throw new errors_1.ForbiddenError(`Change preview requires the promotion ${operation} permission. Ask an administrator for access.`);
        }
    }
    diffPackages({ projectId, direction, base, desired, destinationVariables, }) {
        const previewId = (0, node_crypto_1.randomUUID)();
        const { manifest } = desired;
        const changes = (0, diff_package_files_1.diffPackageFiles)(base, desired.files);
        const changedIds = new Set();
        const renamedIds = new Set();
        const modifiedIds = new Set();
        const changedPaths = new Set();
        for (const fileChange of changes) {
            if (fileChange.change !== 'added')
                changedPaths.add(fileChange.base.path);
            if (fileChange.change !== 'deleted')
                changedPaths.add(fileChange.desired.path);
            const file = fileChange.change === 'deleted' ? fileChange.base : fileChange.desired;
            if (file.type === 'workflow') {
                changedIds.add(file.entityId);
                if (fileChange.change === 'renamed' || fileChange.change === 'renamed-and-modified') {
                    renamedIds.add(file.entityId);
                }
                if (fileChange.change !== 'renamed')
                    modifiedIds.add(file.entityId);
            }
            this.logger.debug('Promotion file change', {
                previewId,
                projectId,
                direction,
                ...fileChange,
            });
        }
        const { affectedWorkflowIds, dependencyCounts } = calculateDependencyImpact({
            base,
            manifest,
            changedPaths,
            projectId,
            destinationVariables,
        });
        for (const workflowId of affectedWorkflowIds) {
            changedIds.add(workflowId);
            modifiedIds.add(workflowId);
        }
        const desiredWorkflows = new Map(manifest.workflows?.map((entry) => [entry.id, entry]));
        this.logger.debug('Promotion change preview', {
            previewId,
            projectId,
            direction,
            baseFileCount: base.length,
            desiredFileCount: desired.files.length,
            fileChangeCount: changes.length,
            workflowIds: [...changedIds],
        });
        const baseWorkflowIds = new Set(base.filter(({ type }) => type === 'workflow').map(({ entityId }) => entityId));
        const desiredWorkflowPaths = new Map(desired.files
            .filter(({ type }) => type === 'workflow')
            .map(({ entityId, path }) => [entityId, path]));
        const archiveCheckPaths = [...changedIds].flatMap((id) => {
            const path = desiredWorkflowPaths.get(id);
            return path !== undefined && desiredWorkflows.has(id) && baseWorkflowIds.has(id)
                ? [path]
                : [];
        });
        return {
            changedIds,
            renamedIds,
            modifiedIds,
            dependencyCounts,
            desiredWorkflows,
            desiredWorkflowPaths,
            archiveCheckPaths,
        };
    }
    async exportInstancePackage(user, projectId) {
        const writer = new hashing_package_writer_1.HashingPackageWriter();
        const archiveState = new Map();
        const { manifest } = await this.packagesService.exportPackageToWriter({
            user,
            projectIds: [projectId],
            includeAgents: false,
            includeArchivedWorkflows: true,
            includeTags: true,
            includeVariableValues: true,
            versionPolicy: n8n_packages_types_1.ExportVersionPolicy.Latest,
            dependencyPolicy: n8n_packages_types_1.ExportDependencyPolicy.ReferenceOnly,
        }, {
            writeDirectory: (path) => writer.writeDirectory(path),
            writeFile(path, content) {
                writer.writeFile(path, content);
                if (path.endsWith(`/${manifest_entry_1.PACKAGE_ENTITY_LAYOUT.workflows.fileName}`)) {
                    const workflow = (0, n8n_workflow_1.jsonParse)(String(content));
                    archiveState.set(`${constants_2.PACKAGE_SUBFOLDER}/${path}`, workflow.isArchived);
                }
            },
        });
        const files = (0, base_branch_files_1.parsePackageFiles)(writer.finalize().map((file) => ({
            ...file,
            path: `${constants_2.PACKAGE_SUBFOLDER}/${file.path}`,
        })), { exportRoot: constants_2.PACKAGE_SUBFOLDER, projectId });
        return { files, manifest, archiveState };
    }
    async readBranchDesired(branch, projectId) {
        const manifestPath = `${constants_2.PACKAGE_SUBFOLDER}/${constants_1.MANIFEST_FILE}`;
        const manifest = manifest_schema_1.packageManifestSchema.safeParse(parseBranchJson((await branch.readFiles([manifestPath])).get(manifestPath) ?? ''));
        if (!manifest.success) {
            throw new errors_1.BadRequestError('The package manifest on the branch cannot be read');
        }
        return { files: branch.files, manifest: scopeManifestToProject(manifest.data, projectId) };
    }
};
exports.PromotionChangeService = PromotionChangeService;
exports.PromotionChangeService = PromotionChangeService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [promotions_service_1.PromotionsService, n8n_packages_service_1.N8nPackagesService, db_1.WorkflowRepository, db_1.VariablesRepository, backend_common_1.Logger])
], PromotionChangeService);
function parseBranchJson(raw) {
    try {
        return (0, n8n_workflow_1.jsonParse)(raw);
    }
    catch {
        return undefined;
    }
}
async function readBranchArchiveState(branch, paths) {
    const files = await branch.readFiles(paths);
    return new Map([...files].map(([path, raw]) => [
        path,
        parseBranchJson(raw)?.isArchived ?? false,
    ]));
}
function scopeManifestToProject(manifest, projectId) {
    const projectTarget = manifest.projects?.find(({ id }) => id === projectId)?.target;
    const inProject = ({ target }) => projectTarget !== undefined && target.startsWith(`${projectTarget}/`);
    const workflows = (manifest.workflows ?? []).filter(inProject);
    const workflowIds = new Set(workflows.map(({ id }) => id));
    const variables = new Map();
    for (const entry of manifest.variables ?? []) {
        const isGlobal = !entry.target.startsWith(`${manifest_entry_1.PACKAGE_ENTITY_LAYOUT.projects.directory}/`);
        if (inProject(entry) || (isGlobal && !variables.has(entry.name))) {
            variables.set(entry.name, entry);
        }
    }
    const scopeRows = (rows) => {
        const kept = rows
            ?.map((row) => ({
            ...row,
            usedBy: row.usedBy.filter(({ kind, id }) => kind === 'workflow' && workflowIds.has(id)),
        }))
            .filter((row) => row.usedBy.length > 0);
        return kept?.length ? kept : undefined;
    };
    const { requirements } = manifest;
    return {
        ...manifest,
        workflows,
        variables: [...variables.values()],
        requirements: requirements && {
            credentials: scopeRows(requirements.credentials),
            dataTables: scopeRows(requirements.dataTables),
            workflows: scopeRows(requirements.workflows),
            variables: scopeRows(requirements.variables),
            tags: scopeRows(requirements.tags),
            nodeTypes: scopeRows(requirements.nodeTypes),
        },
    };
}
function applyQuery(changes, query) {
    const search = query.search?.toLowerCase();
    return changes
        .filter(({ name }) => !search || name.toLowerCase().includes(search))
        .sort((a, b) => {
        const comparison = (a[query.sort] ?? '').localeCompare(b[query.sort] ?? '');
        return (query.order === 'desc' ? -comparison : comparison) || a.id.localeCompare(b.id);
    });
}
function calculateDependencyImpact({ base, manifest, changedPaths, projectId, destinationVariables, }) {
    const destinationVariableKeys = destinationVariables &&
        new Set(destinationVariables.map(({ key, projectId: owner }) => variableKey(key, owner === null ? 'global' : 'project')));
    const baseDependencies = new Map();
    for (const file of base) {
        const key = JSON.stringify([
            file.fileName,
            file.type === 'variable' ? file.slug : file.entityId,
        ]);
        const group = baseDependencies.get(key) ?? [];
        group.push(file);
        baseDependencies.set(key, group);
    }
    const affectedWorkflowIds = new Set();
    const dependencyCounts = new Map();
    for (const collection of Object.values(DEPENDENCY_COLLECTIONS)) {
        if (collection === null)
            continue;
        const entries = new Map(manifest[collection]?.map((entry) => [
            collection === 'variables' ? entry.name : entry.id,
            entry,
        ]));
        for (const requirement of manifest.requirements?.[collection] ?? []) {
            const key = 'id' in requirement ? requirement.id : requirement.name;
            const entry = entries.get(key);
            const baseKey = collection === 'variables' ? (0, slug_utils_1.generateSlug)(key, 'variable') : key;
            const group = baseDependencies.get(JSON.stringify([manifest_entry_1.PACKAGE_ENTITY_LAYOUT[collection].fileName, baseKey])) ?? [];
            const projectFiles = group.filter((file) => file.projectId === projectId);
            const scopedFiles = projectFiles.length ? projectFiles : group;
            const sameId = entry ? scopedFiles.filter(({ entityId }) => entityId === entry.id) : [];
            const previous = sameId.length ? sameId : scopedFiles;
            const currentPath = entry
                ? `${constants_2.PACKAGE_SUBFOLDER}/${(0, manifest_entry_1.entityFilePath)(collection, entry.target)}`
                : undefined;
            let dependencyChanged = false;
            if (collection === 'variables') {
                dependencyChanged = variableChanged({
                    name: key,
                    entry,
                    baseFiles: group,
                    projectId,
                    destinationVariableKeys,
                });
            }
            else if (collection !== 'workflows') {
                dependencyChanged =
                    previous.some(({ path }) => changedPaths.has(path)) ||
                        (currentPath !== undefined && changedPaths.has(currentPath));
            }
            for (const workflowId of (0, requirement_consumers_1.getWorkflowConsumerIds)(requirement)) {
                dependencyCounts.set(workflowId, (dependencyCounts.get(workflowId) ?? 0) + 1);
                if (dependencyChanged)
                    affectedWorkflowIds.add(workflowId);
            }
        }
    }
    return { affectedWorkflowIds, dependencyCounts };
}
function variableChanged({ name, entry, baseFiles, projectId, destinationVariableKeys, }) {
    const desiredScope = entryScope(entry);
    if (destinationVariableKeys === null)
        return filesScope(baseFiles, projectId) !== desiredScope;
    const exists = (scope) => destinationVariableKeys.has(variableKey(name, scope));
    if (desiredScope === undefined)
        return exists('project') || exists('global');
    return !exists(desiredScope);
}
function entryScope(entry) {
    if (!entry)
        return undefined;
    return entry.target.startsWith(`${manifest_entry_1.PACKAGE_ENTITY_LAYOUT.projects.directory}/`)
        ? 'project'
        : 'global';
}
function filesScope(files, projectId) {
    if (files.some((file) => file.projectId === projectId))
        return 'project';
    if (files.length > 0)
        return 'global';
    return undefined;
}
function variableKey(name, scope) {
    return JSON.stringify([scope, name]);
}
function buildPromotableResources({ base, desiredWorkflows, desiredWorkflowPaths, archiveState, changedIds, renamedIds, modifiedIds, metadata, dependencyCounts, }) {
    const metadataById = new Map(metadata.map((workflow) => [workflow.id, workflow]));
    const baseWorkflowSlugs = new Map(base.filter(({ type }) => type === 'workflow').map(({ entityId, slug }) => [entityId, slug]));
    return [...changedIds].map((id) => {
        const entry = desiredWorkflows.get(id);
        const workflow = metadataById.get(id);
        const path = desiredWorkflowPaths.get(id);
        let status = 'modified';
        if (!entry)
            status = 'deleted';
        else if (!baseWorkflowSlugs.has(id))
            status = 'new';
        else if (path !== undefined && archiveState.get(path))
            status = 'archived';
        else if (renamedIds.has(id)) {
            status = modifiedIds.has(id) ? 'renamed-and-modified' : 'renamed';
        }
        return {
            id,
            name: entry?.name ?? workflow?.name ?? baseWorkflowSlugs.get(id) ?? id,
            type: 'workflow',
            status,
            version: workflow?.versionCounter ?? null,
            updatedAt: workflow?.updatedAt.toISOString() ?? null,
            updatedBy: null,
            dependencyCount: dependencyCounts.get(id) ?? 0,
        };
    });
}
//# sourceMappingURL=promotion-change.service.js.map