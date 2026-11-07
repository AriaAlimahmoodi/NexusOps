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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLeftoverManifest = readLeftoverManifest;
exports.writeImportManifest = writeImportManifest;
const n8n_workflow_1 = require("n8n-workflow");
const fs = __importStar(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../../constants");
const constants_2 = require("../../modules/n8n-packages/spec/constants");
const manifest_schema_1 = require("../../modules/n8n-packages/spec/manifest.schema");
const requirement_consumers_1 = require("../../modules/n8n-packages/spec/requirement-consumers");
const branch_placement_1 = require("./branch-placement");
const SNAPSHOT_FILES = {
    'project.json': 'projects',
    'folder.json': 'folders',
    'workflow.json': 'workflows',
    'credential.json': 'credentials',
    'data-table.json': 'dataTables',
    'tag.json': 'tags',
};
async function readLeftoverManifest(exportFolder) {
    let raw;
    try {
        raw = await fs.readFile(node_path_1.default.join(exportFolder, constants_2.MANIFEST_FILE), 'utf-8');
    }
    catch {
        return undefined;
    }
    try {
        const parsed = manifest_schema_1.packageManifestSchema.safeParse((0, n8n_workflow_1.jsonParse)(raw));
        return parsed.success ? parsed.data : undefined;
    }
    catch {
        return undefined;
    }
}
function dropSelectedRequirementUsers(leftover, selectedWorkflowIds) {
    if (leftover?.requirements === undefined || selectedWorkflowIds.length === 0) {
        return leftover;
    }
    const selected = new Set(selectedWorkflowIds);
    const requirements = compactRequirements({
        credentials: dropSelectedUsers(leftover.requirements.credentials, selected),
        dataTables: dropSelectedUsers(leftover.requirements.dataTables, selected),
        workflows: dropSelectedUsers(leftover.requirements.workflows, selected),
        variables: dropSelectedUsers(leftover.requirements.variables, selected),
        tags: dropSelectedUsers(leftover.requirements.tags, selected),
        nodeTypes: dropSelectedUsers(leftover.requirements.nodeTypes, selected),
    });
    return { ...leftover, ...(requirements ? { requirements } : { requirements: undefined }) };
}
function dropSelectedUsers(rows, selectedWorkflowIds) {
    if (rows === undefined)
        return undefined;
    const kept = rows
        .map((row) => ({
        ...row,
        usedBy: row.usedBy.filter(({ kind, id }) => kind === 'workflow' && !selectedWorkflowIds.has(id)),
    }))
        .filter((row) => row.usedBy.length > 0);
    return kept.length > 0 ? kept : undefined;
}
async function writeImportManifest(options) {
    const { exportFolder, staging, sourceId, selectedWorkflowIds = [], containerMoves = [], } = options;
    const selected = [...selectedWorkflowIds, ...(staging.workflows ?? []).map((entry) => entry.id)];
    const leftover = dropSelectedRequirementUsers(await readLeftoverManifest(exportFolder), selected);
    const collections = await walkSnapshotCollections(exportFolder);
    const remainingWorkflowIds = new Set((collections.workflows ?? []).map((entry) => entry.id));
    const selectedSet = new Set(selected);
    const variables = await collectVariables(exportFolder, leftover, staging, containerMoves);
    const manifest = manifest_schema_1.packageManifestSchema.parse({
        packageFormatVersion: '1',
        exportedAt: new Date().toISOString(),
        sourceN8nVersion: constants_1.N8N_VERSION,
        sourceId,
        ...collections,
        ...(variables.length > 0 ? { variables } : {}),
        ...requirementsBlock(leftover, staging, remainingWorkflowIds, selectedSet),
    });
    await fs.writeFile(node_path_1.default.join(exportFolder, constants_2.MANIFEST_FILE), JSON.stringify(manifest, null, '\t'));
}
async function walkSnapshotCollections(exportFolder) {
    const state = {
        projects: [],
        folders: [],
        workflows: [],
        credentials: [],
        dataTables: [],
        tags: [],
    };
    const walk = async (absDir) => {
        const entries = await fs.readdir(absDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = node_path_1.default.join(absDir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
                continue;
            }
            if (!entry.isFile())
                continue;
            const kind = SNAPSHOT_FILES[entry.name];
            if (kind === undefined)
                continue;
            const relativeFile = node_path_1.default.relative(exportFolder, fullPath).split(node_path_1.default.sep).join('/');
            const target = node_path_1.default.posix.dirname(relativeFile);
            const item = await readIdNameFile(fullPath, target);
            if (item)
                state[kind].push(item);
        }
    };
    await walk(exportFolder);
    return {
        ...(state.projects.length > 0 ? { projects: state.projects } : {}),
        ...(state.folders.length > 0 ? { folders: state.folders } : {}),
        ...(state.workflows.length > 0 ? { workflows: state.workflows } : {}),
        ...(state.credentials.length > 0 ? { credentials: state.credentials } : {}),
        ...(state.dataTables.length > 0 ? { dataTables: state.dataTables } : {}),
        ...(state.tags.length > 0 ? { tags: state.tags } : {}),
    };
}
async function readIdNameFile(file, target) {
    let parsed;
    try {
        parsed = (0, n8n_workflow_1.jsonParse)(await fs.readFile(file, 'utf-8'));
    }
    catch {
        return undefined;
    }
    if (typeof parsed !== 'object' ||
        parsed === null ||
        typeof parsed.id !== 'string' ||
        typeof parsed.name !== 'string') {
        return undefined;
    }
    return { id: parsed.id, name: parsed.name, target };
}
async function collectVariables(exportFolder, leftover, staging, containerMoves) {
    const byId = new Map();
    for (const entry of leftover?.variables ?? []) {
        byId.set(entry.id, { ...entry, target: (0, branch_placement_1.remapPath)(entry.target, containerMoves) });
    }
    for (const entry of staging.variables ?? []) {
        byId.set(entry.id, entry);
    }
    const kept = [];
    for (const entry of byId.values()) {
        const file = resolveContainedFile(exportFolder, entry.target, 'variable.json');
        if (file === undefined)
            continue;
        try {
            const info = await fs.lstat(file);
            if (!info.isFile())
                continue;
            kept.push(entry);
        }
        catch {
            continue;
        }
    }
    return kept;
}
function resolveContainedFile(exportFolder, target, fileName) {
    const segments = target.split(/[\\/]/).filter(Boolean);
    if (segments.length === 0 || segments.some((segment) => segment === '.' || segment === '..')) {
        return undefined;
    }
    const resolvedBase = node_path_1.default.resolve(exportFolder);
    const resolvedDir = node_path_1.default.resolve(exportFolder, ...segments);
    if (resolvedDir !== resolvedBase && !resolvedDir.startsWith(resolvedBase + node_path_1.default.sep)) {
        return undefined;
    }
    return node_path_1.default.join(resolvedDir, fileName);
}
function requirementsBlock(leftover, staging, remainingWorkflowIds, selectedWorkflowIds) {
    const requirements = compactRequirements({
        credentials: mergeRequirementRows(leftover?.requirements?.credentials, staging.requirements?.credentials, remainingWorkflowIds, selectedWorkflowIds, (row) => row.id),
        dataTables: mergeRequirementRows(leftover?.requirements?.dataTables, staging.requirements?.dataTables, remainingWorkflowIds, selectedWorkflowIds, (row) => row.id),
        workflows: mergeRequirementRows(leftover?.requirements?.workflows, staging.requirements?.workflows, remainingWorkflowIds, selectedWorkflowIds, (row) => row.id),
        variables: mergeRequirementRows(leftover?.requirements?.variables, staging.requirements?.variables, remainingWorkflowIds, selectedWorkflowIds, (row) => row.name),
        tags: mergeRequirementRows(leftover?.requirements?.tags, staging.requirements?.tags, remainingWorkflowIds, selectedWorkflowIds, (row) => row.id),
        nodeTypes: mergeRequirementRows(leftover?.requirements?.nodeTypes, staging.requirements?.nodeTypes, remainingWorkflowIds, selectedWorkflowIds, (row) => `${row.type}@${row.typeVersion}`),
    });
    return requirements ? { requirements } : {};
}
function mergeRequirementRows(leftover, staging, remainingWorkflowIds, selectedWorkflowIds, keyOf) {
    const byKey = new Map();
    for (const row of leftover ?? []) {
        const usedBy = remainingUsers(row.usedBy.filter(({ kind, id }) => kind === 'workflow' && !selectedWorkflowIds.has(id)), remainingWorkflowIds);
        if (usedBy.length === 0)
            continue;
        byKey.set(keyOf(row), { ...row, usedBy });
    }
    for (const row of staging ?? []) {
        const key = keyOf(row);
        const usedBy = remainingUsers([...(byKey.get(key)?.usedBy ?? []), ...row.usedBy], remainingWorkflowIds);
        if (usedBy.length === 0) {
            byKey.delete(key);
            continue;
        }
        byKey.set(key, { ...row, usedBy });
    }
    const rows = [...byKey.values()];
    return rows.length > 0 ? rows : undefined;
}
function remainingUsers(usedBy, remainingWorkflowIds) {
    return [
        ...new Set((0, requirement_consumers_1.getWorkflowConsumerIds)({ usedBy }).filter((id) => remainingWorkflowIds.has(id))),
    ]
        .sort()
        .map((id) => ({ kind: 'workflow', id }));
}
function compactRequirements(input) {
    const { credentials, dataTables, workflows, variables, tags, nodeTypes } = input;
    const requirements = {
        ...(credentials?.length ? { credentials } : {}),
        ...(dataTables?.length ? { dataTables } : {}),
        ...(workflows?.length ? { workflows } : {}),
        ...(variables?.length ? { variables } : {}),
        ...(tags?.length ? { tags } : {}),
        ...(nodeTypes?.length ? { nodeTypes } : {}),
    };
    return Object.keys(requirements).length > 0 ? requirements : undefined;
}
//# sourceMappingURL=import-manifest-bridge.js.map