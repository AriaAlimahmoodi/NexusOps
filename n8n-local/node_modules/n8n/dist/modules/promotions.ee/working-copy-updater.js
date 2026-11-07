"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkingCopyUpdater = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const fs = __importStar(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const errors_1 = require("@n8n/errors");
const constants_1 = require("../../modules/n8n-packages/spec/constants");
const branch_placement_1 = require("./branch-placement");
const import_manifest_bridge_1 = require("./import-manifest-bridge");
const promotions_selective_push_error_1 = require("./promotions-selective-push.error");
const selectivePushOptionsSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(1),
    workflowIds: zod_1.z.array(zod_1.z.string().min(1)),
    deletedWorkflowIds: zod_1.z.array(zod_1.z.string().min(1)),
});
const ENTITY_FILES = {
    'project.json': 'projects',
    'folder.json': 'folders',
    'workflow.json': 'workflows',
};
const DEPENDENCY_COLLECTIONS = ['credentials', 'dataTables', 'tags'];
const DEPENDENCY_FILES = {
    'credential.json': 'credentials',
    'data-table.json': 'dataTables',
    'tag.json': 'tags',
};
const DEPENDENCY_FILE_BY_COLLECTION = {
    credentials: 'credential.json',
    dataTables: 'data-table.json',
    tags: 'tag.json',
};
let WorkingCopyUpdater = class WorkingCopyUpdater {
    constructor(instanceSettings, logger) {
        this.instanceSettings = instanceSettings;
        this.logger = logger;
        this.logger = this.logger.scoped('promotions');
    }
    validateSelection(selection) {
        const parsed = selectivePushOptionsSchema.safeParse(selection);
        if (!parsed.success) {
            throw new errors_1.BadRequestError(`Invalid selection: ${parsed.error.issues[0].message}`);
        }
        if (selection.workflowIds.length === 0 && selection.deletedWorkflowIds.length === 0) {
            throw new errors_1.BadRequestError('At least one workflow must be selected or deleted');
        }
        const addSet = new Set(selection.workflowIds);
        if (addSet.size !== selection.workflowIds.length) {
            throw new errors_1.BadRequestError('workflowIds contains duplicates');
        }
        const deleteSet = new Set(selection.deletedWorkflowIds);
        if (deleteSet.size !== selection.deletedWorkflowIds.length) {
            throw new errors_1.BadRequestError('deletedWorkflowIds contains duplicates');
        }
        const overlap = selection.deletedWorkflowIds.filter((id) => addSet.has(id));
        if (overlap.length > 0) {
            throw new errors_1.BadRequestError('A workflow cannot be both selected and deleted in the same push');
        }
    }
    assertStagingMatchesSelection(staging, selection) {
        const stagedIds = new Set((staging.workflows ?? []).map((workflow) => workflow.id));
        const selectedIds = new Set(selection.workflowIds);
        const missing = selection.workflowIds.filter((id) => !stagedIds.has(id));
        const extra = [...stagedIds].filter((id) => !selectedIds.has(id));
        if (missing.length === 0 && extra.length === 0)
            return;
        const parts = [];
        if (missing.length > 0)
            parts.push(`missing ${missing.join(', ')}`);
        if (extra.length > 0)
            parts.push(`extra ${extra.join(', ')}`);
        throw new errors_1.BadRequestError(`The export does not match the selection (${parts.join('; ')})`);
    }
    async readBranchLayout(exportFolder) {
        return (await this.scanBranch(exportFolder)).state;
    }
    async scanBranch(exportFolder) {
        const resolvedBase = await this.resolveContained(exportFolder, '.');
        const rootInfo = await fs.stat(resolvedBase).catch(() => null);
        if (!rootInfo?.isDirectory())
            return { state: {}, dependencies: [] };
        const collected = { projects: [], folders: [], workflows: [] };
        const dependencies = [];
        const walk = async (absDir) => {
            const entries = await fs.readdir(absDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = node_path_1.default.join(absDir, entry.name);
                if (entry.isSymbolicLink()) {
                    throw new errors_1.BadRequestError(`"${node_path_1.default.relative(resolvedBase, fullPath) || '.'}" on the branch is a symbolic link. Remove it and retry.`);
                }
                if (entry.isDirectory()) {
                    await walk(fullPath);
                    continue;
                }
                if (!entry.isFile())
                    continue;
                const relativeFile = node_path_1.default.relative(resolvedBase, fullPath).split(node_path_1.default.sep).join('/');
                const target = node_path_1.default.posix.dirname(relativeFile);
                const kind = ENTITY_FILES[entry.name];
                if (kind !== undefined) {
                    collected[kind].push(await this.readEntityFile(fullPath, target, relativeFile));
                    continue;
                }
                const collection = DEPENDENCY_FILES[entry.name];
                if (collection !== undefined) {
                    const id = await this.readEntityId(fullPath);
                    if (id !== undefined)
                        dependencies.push({ collection, id, target });
                }
            }
        };
        await walk(resolvedBase);
        this.assertUniqueEntityIds(collected);
        this.assertUniqueDependencyIds(dependencies);
        const state = {
            ...(collected.projects.length > 0 ? { projects: collected.projects } : {}),
            ...(collected.folders.length > 0 ? { folders: collected.folders } : {}),
            ...(collected.workflows.length > 0 ? { workflows: collected.workflows } : {}),
        };
        return { state, dependencies };
    }
    assertUniqueEntityIds(state) {
        for (const [label, entries] of [
            ['projects', state.projects],
            ['folders', state.folders],
            ['workflows', state.workflows],
        ]) {
            const seen = new Map();
            for (const entry of entries ?? []) {
                const previous = seen.get(entry.id);
                if (previous !== undefined) {
                    throw new errors_1.BadRequestError(`The branch holds two ${label} with id "${entry.id}" (${previous} and ${entry.target}). Remove the duplicate and retry.`);
                }
                seen.set(entry.id, entry.target);
            }
        }
    }
    assertUniqueDependencyIds(dependencies) {
        const seen = new Map();
        for (const dependency of dependencies) {
            const key = `${dependency.collection}:${dependency.id}`;
            const previous = seen.get(key);
            if (previous !== undefined) {
                throw new errors_1.BadRequestError(`The branch holds two ${dependency.collection} with id "${dependency.id}" (${previous} and ${dependency.target}). Remove the duplicate and retry.`);
            }
            seen.set(key, dependency.target);
        }
    }
    async readEntityFile(file, target, relativeFile) {
        let raw;
        try {
            raw = await fs.readFile(file, 'utf-8');
        }
        catch {
            throw new errors_1.BadRequestError(`Cannot read "${relativeFile}" on the branch. Remove it and retry.`);
        }
        let parsed;
        try {
            parsed = (0, n8n_workflow_1.jsonParse)(raw);
        }
        catch {
            throw new errors_1.BadRequestError(`"${relativeFile}" on the branch is not valid JSON. Remove it and retry.`);
        }
        if (typeof parsed !== 'object' ||
            parsed === null ||
            typeof parsed.id !== 'string' ||
            typeof parsed.name !== 'string') {
            throw new errors_1.BadRequestError(`"${relativeFile}" on the branch is missing an id or a name. Remove it and retry.`);
        }
        return { id: parsed.id, name: parsed.name, target };
    }
    async assertSelectionFitsBranch(exportFolder, selection) {
        try {
            const branch = await this.scanBranch(exportFolder);
            this.assertDeletionsOnBranch(branch.state, selection);
            this.assertNoCrossProjectMoves(branch.state, selection);
            return branch;
        }
        catch (error) {
            if (error instanceof errors_1.BadRequestError)
                throw error;
            this.logger.error('Failed to scan the selective push working copy', { error });
            throw new errors_1.InternalServerError('Failed to apply the selection to the branch. Check the server logs for details.');
        }
    }
    assertDeletionsOnBranch(branch, selection) {
        if (selection.deletedWorkflowIds.length === 0)
            return;
        const targetById = new Map((branch.workflows ?? []).map((w) => [w.id, w.target]));
        const unknown = selection.deletedWorkflowIds.filter((id) => !targetById.has(id));
        if (unknown.length > 0) {
            throw new errors_1.BadRequestError(`Deleted workflows not found on the branch: ${unknown.join(', ')}`);
        }
        const projectTarget = branch.projects?.find((p) => p.id === selection.projectId)?.target;
        const foreign = selection.deletedWorkflowIds.filter((id) => {
            const target = targetById.get(id);
            return !projectTarget || !target || !(0, branch_placement_1.isUnder)(target, projectTarget);
        });
        if (foreign.length > 0) {
            throw new errors_1.BadRequestError(`Deleted workflows do not belong to the selected project: ${foreign.join(', ')}`);
        }
    }
    assertNoCrossProjectMoves(branch, selection) {
        if (selection.workflowIds.length === 0)
            return;
        const projectTarget = branch.projects?.find((p) => p.id === selection.projectId)?.target;
        const selected = new Set(selection.workflowIds);
        const moved = (branch.workflows ?? []).filter((w) => selected.has(w.id) && (!projectTarget || !(0, branch_placement_1.isUnder)(w.target, projectTarget)));
        if (moved.length > 0) {
            throw new promotions_selective_push_error_1.PromotionsWorkflowsMovedCrossProjectError(moved.map((workflow) => workflow.id));
        }
    }
    assertNoCrossProjectContainerMoves(branch, projectId, moves) {
        const projectTarget = branch.projects?.find((p) => p.id === projectId)?.target;
        const foreign = moves.find(({ from }) => projectTarget === undefined || !(from === projectTarget || (0, branch_placement_1.isUnder)(from, projectTarget)));
        if (foreign) {
            throw new errors_1.BadRequestError(`"${foreign.from}" belongs to another project on the branch. A selective push cannot move it. Push all projects instead.`);
        }
    }
    async applySelection(exportFolder, stagingFolder, staging, selection, branch) {
        this.validateSelection(selection);
        this.assertStagingMatchesSelection(staging, selection);
        const parent = node_path_1.default.dirname(exportFolder);
        const tempBase = node_path_1.default.dirname(parent);
        let workFolder;
        let backupFolder;
        let createdExport = false;
        try {
            const { state: existing, dependencies } = branch;
            const otherProjectTargets = (existing.projects ?? [])
                .filter((p) => p.id !== selection.projectId)
                .map((p) => p.target);
            const moves = (0, branch_placement_1.containerMoves)(existing, staging);
            this.assertNoCrossProjectContainerMoves(existing, selection.projectId, moves);
            const remaining = {
                ...existing,
                workflows: (existing.workflows ?? []).filter((workflow) => !selection.deletedWorkflowIds.includes(workflow.id)),
            };
            await this.resolveContained(parent, node_path_1.default.basename(exportFolder));
            const firstCreated = await fs.mkdir(exportFolder, { recursive: true });
            createdExport = firstCreated !== undefined;
            workFolder = await fs.mkdtemp(node_path_1.default.join(tempBase, `.${node_path_1.default.basename(exportFolder)}-`));
            await fs.cp(exportFolder, workFolder, { recursive: true, verbatimSymlinks: true });
            for (const target of (0, branch_placement_1.staleWorkflowTargets)(existing, staging, new Set(selection.deletedWorkflowIds))) {
                await fs.rm(await this.assertRemovableLeafTarget(workFolder, target, remaining, staging), {
                    recursive: true,
                    force: true,
                });
            }
            const { renamedInScope, outOfScopeInStaging } = this.partitionChangedDependencies(dependencies, staging, otherProjectTargets);
            for (const { collection, target } of renamedInScope) {
                const dir = await this.resolveLeafTarget(workFolder, target, 'Dependency');
                await fs.rm(node_path_1.default.join(dir, DEPENDENCY_FILE_BY_COLLECTION[collection]), { force: true });
                if ((await fs.readdir(dir)).length === 0)
                    await fs.rmdir(dir);
            }
            await this.relocateBranchContainers(workFolder, moves);
            await this.overlayDirectory(stagingFolder, workFolder, outOfScopeInStaging);
            await (0, import_manifest_bridge_1.writeImportManifest)({
                exportFolder: workFolder,
                staging,
                sourceId: this.instanceSettings.instanceId,
                selectedWorkflowIds: selection.workflowIds,
                containerMoves: moves,
            });
            const backupPath = node_path_1.default.join(tempBase, `.${node_path_1.default.basename(exportFolder)}-bak-${(0, node_crypto_1.randomUUID)()}`);
            await fs.rename(exportFolder, backupPath);
            backupFolder = backupPath;
            await fs.rename(workFolder, exportFolder);
            backupFolder = undefined;
            try {
                await fs.rm(backupPath, { recursive: true, force: true });
            }
            catch (cleanupError) {
                this.logger.warn('Failed to remove the export backup after a successful swap', {
                    backupFolder: backupPath,
                    error: cleanupError,
                });
            }
        }
        catch (error) {
            if (backupFolder !== undefined) {
                await fs
                    .rm(exportFolder, { recursive: true, force: true })
                    .catch((restoreError) => {
                    this.logger.warn('Failed to remove the incomplete export after a failed swap', {
                        exportFolder,
                        error: restoreError,
                    });
                });
                await fs.rename(backupFolder, exportFolder).catch((restoreError) => {
                    this.logger.warn('Failed to restore the export from backup. The copy is at the backup path.', { exportFolder, backupFolder, error: restoreError });
                });
            }
            else if (createdExport) {
                await fs.rm(exportFolder, { recursive: true, force: true }).catch((rmError) => {
                    this.logger.warn('Failed to remove the newly created export after a failed first push', {
                        exportFolder,
                        error: rmError,
                    });
                });
            }
            if (error instanceof errors_1.BadRequestError)
                throw error;
            this.logger.error('Failed to apply the selective push to the working copy', { error });
            throw new errors_1.InternalServerError('Failed to apply the selection to the branch. Check the server logs for details.');
        }
        finally {
            if (workFolder)
                await fs.rm(workFolder, { recursive: true, force: true });
        }
    }
    async assertRemovableLeafTarget(exportFolder, target, remaining, staging) {
        const resolved = await this.resolveLeafTarget(exportFolder, target, 'Manifest');
        const writtenIds = new Set((staging.workflows ?? []).map((entry) => entry.id));
        for (const entry of remaining.workflows ?? []) {
            if ((0, branch_placement_1.isUnder)(entry.target, target)) {
                throw new errors_1.BadRequestError(`Removing "${target}" would delete content the selection keeps. Remove it and retry.`);
            }
            if (entry.target === target && !writtenIds.has(entry.id)) {
                throw new errors_1.BadRequestError(`Removing "${target}" would delete content the selection keeps. Remove it and retry.`);
            }
        }
        const containers = [...(remaining.projects ?? []), ...(remaining.folders ?? [])].map((entry) => entry.target);
        if (containers.some((container) => container === target || (0, branch_placement_1.isUnder)(container, target))) {
            throw new errors_1.BadRequestError(`Removing "${target}" would delete content the selection keeps. Remove it and retry.`);
        }
        return resolved;
    }
    partitionChangedDependencies(dependencies, staging, otherProjectTargets) {
        const stagingTargets = new Map();
        for (const collection of DEPENDENCY_COLLECTIONS) {
            for (const entry of staging[collection] ?? []) {
                stagingTargets.set(`${collection}:${entry.id}`, entry.target);
            }
        }
        const renamedInScope = [];
        const outOfScopeInStaging = new Set();
        for (const dependency of dependencies) {
            const newTarget = stagingTargets.get(`${dependency.collection}:${dependency.id}`);
            if (newTarget === undefined || newTarget === dependency.target)
                continue;
            const underOtherProject = otherProjectTargets.some((pt) => (0, branch_placement_1.isUnder)(dependency.target, pt));
            if (underOtherProject) {
                outOfScopeInStaging.add(newTarget);
            }
            else {
                renamedInScope.push({ collection: dependency.collection, target: dependency.target });
            }
        }
        return { renamedInScope, outOfScopeInStaging };
    }
    async readEntityId(file) {
        let parsed;
        try {
            parsed = (0, n8n_workflow_1.jsonParse)(await fs.readFile(file, 'utf-8'));
        }
        catch {
            return undefined;
        }
        if (typeof parsed === 'object' &&
            parsed !== null &&
            typeof parsed.id === 'string') {
            return parsed.id;
        }
        return undefined;
    }
    async resolveLeafTarget(exportFolder, target, label) {
        const reject = () => new errors_1.BadRequestError(`${label} target "${target}" is not a managed leaf directory. Remove it and retry.`);
        const segments = target.split(/[\\/]/).filter(Boolean);
        if (segments.length === 0 || segments.includes('.') || segments.includes('..'))
            throw reject();
        const resolved = await this.resolveContained(exportFolder, target);
        if (resolved === node_path_1.default.resolve(exportFolder))
            throw reject();
        return resolved;
    }
    async relocateBranchContainers(workFolder, moves) {
        if (moves.length === 0)
            return;
        const sources = await Promise.all(moves.map(async ({ from }) => await this.resolveLeafTarget(workFolder, from, 'Container')));
        const destinations = await Promise.all(moves.map(async ({ to }) => await this.resolveLeafTarget(workFolder, to, 'Container')));
        const stash = await fs.mkdtemp(node_path_1.default.join(node_path_1.default.dirname(workFolder), '.relocate-'));
        try {
            const parked = [];
            for (const [index, move] of moves.entries()) {
                const holding = node_path_1.default.join(stash, String(index));
                await fs.rename(sources[index], holding);
                parked.push({ holding, dest: destinations[index], move });
            }
            parked.sort((a, b) => a.move.to.length - b.move.to.length);
            for (const { holding, dest, move } of parked) {
                if (await fs.lstat(dest).catch(() => null)) {
                    throw new errors_1.BadRequestError(`The branch path "${move.to}" is already in use. Remove it and retry.`);
                }
                await fs.mkdir(node_path_1.default.dirname(dest), { recursive: true });
                await fs.rename(holding, dest);
            }
        }
        finally {
            await fs.rm(stash, { recursive: true, force: true });
        }
    }
    async overlayDirectory(src, dest, keptFiles) {
        const verified = new Set();
        const walk = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isSymbolicLink())
                    continue;
                const fullPath = node_path_1.default.join(dir, entry.name);
                const relative = node_path_1.default.relative(src, fullPath).split(node_path_1.default.sep).join('/');
                if (relative === constants_1.MANIFEST_FILE || keptFiles.has(relative))
                    continue;
                const destPath = await this.resolveContained(dest, relative, verified);
                if (entry.isDirectory()) {
                    await fs.mkdir(destPath, { recursive: true });
                    await walk(fullPath);
                }
                else if (entry.isFile()) {
                    await fs.mkdir(node_path_1.default.dirname(destPath), { recursive: true });
                    await fs.copyFile(fullPath, destPath);
                }
            }
        };
        await walk(src);
    }
    async resolveContained(base, relativePath, verified = new Set()) {
        const resolvedBase = node_path_1.default.resolve(base);
        const resolved = node_path_1.default.resolve(base, relativePath);
        if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + node_path_1.default.sep)) {
            throw new errors_1.BadRequestError('Manifest target resolves outside the export directory');
        }
        const components = node_path_1.default
            .relative(resolvedBase, resolved)
            .split(node_path_1.default.sep)
            .filter(Boolean)
            .reduce((acc, segment) => [...acc, node_path_1.default.join(acc.at(-1), segment)], [resolvedBase]);
        for (const component of components) {
            if (verified.has(component))
                continue;
            const info = await fs.lstat(component).catch(() => null);
            if (!info)
                break;
            if (info.isSymbolicLink()) {
                throw new errors_1.BadRequestError(`"${node_path_1.default.relative(resolvedBase, component) || '.'}" on the branch is a symbolic link. Remove it and retry.`);
            }
            if (info.isDirectory())
                verified.add(component);
        }
        return resolved;
    }
};
exports.WorkingCopyUpdater = WorkingCopyUpdater;
exports.WorkingCopyUpdater = WorkingCopyUpdater = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings, backend_common_1.Logger])
], WorkingCopyUpdater);
//# sourceMappingURL=working-copy-updater.js.map