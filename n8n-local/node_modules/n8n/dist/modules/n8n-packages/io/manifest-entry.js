"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKFLOW_METADATA_FILE_NAME = exports.PACKAGE_ENTITY_LAYOUT = void 0;
exports.packageDirectory = packageDirectory;
exports.projectScopedDirectory = projectScopedDirectory;
exports.entityFilePath = entityFilePath;
exports.workflowMetadataFilePath = workflowMetadataFilePath;
exports.agentMetadataFilePath = agentMetadataFilePath;
exports.createManifestEntry = createManifestEntry;
exports.writeManifestEntry = writeManifestEntry;
exports.writeWorkflowManifestEntry = writeWorkflowManifestEntry;
const entity_file_format_1 = require("./entity-file-format");
const slug_utils_1 = require("./slug.utils");
const package_export_errors_1 = require("../entities/package-export.errors");
exports.PACKAGE_ENTITY_LAYOUT = {
    projects: { directory: 'projects', fileName: 'project.json' },
    folders: { directory: 'folders', fileName: 'folder.json' },
    workflows: { directory: 'workflows', fileName: 'workflow.json' },
    agents: { directory: 'agents', fileName: 'agent.json' },
    credentials: { directory: 'credentials', fileName: 'credential.json' },
    dataTables: { directory: 'data-tables', fileName: 'data-table.json' },
    variables: { directory: 'variables', fileName: 'variable.json' },
    tags: { directory: 'tags', fileName: 'tag.json' },
};
const SAFE_ID = /^[A-Za-z0-9_]+$/;
const MAX_PATH_SEGMENT_LENGTH = 255;
const FALLBACK_SLUGS = {
    projects: 'project',
    folders: 'folder',
    workflows: 'workflow',
    agents: 'agent',
    credentials: 'credential',
    dataTables: 'data-table',
    variables: 'variable',
    tags: 'tag',
};
function packageDirectory(collection, basePrefix) {
    const { directory } = exports.PACKAGE_ENTITY_LAYOUT[collection];
    return basePrefix ? `${basePrefix}/${directory}` : directory;
}
function projectScopedDirectory(collection, ownerProjectId, projectTargetsById) {
    const prefix = ownerProjectId ? projectTargetsById?.get(ownerProjectId) : undefined;
    return packageDirectory(collection, prefix);
}
function entityFilePath(collection, target) {
    return `${target}/${exports.PACKAGE_ENTITY_LAYOUT[collection].fileName}`;
}
exports.WORKFLOW_METADATA_FILE_NAME = 'workflow-metadata.json';
function workflowMetadataFilePath(target) {
    return `${target}/${exports.WORKFLOW_METADATA_FILE_NAME}`;
}
function agentMetadataFilePath(target) {
    return `${target}/agent-metadata.json`;
}
function createManifestEntry(collection, baseDir, entity) {
    if (!SAFE_ID.test(entity.id)) {
        throw new package_export_errors_1.PackageExportBlockedError(`${collection} entry "${entity.name}" has an id that cannot be used as a path segment. Export aborted.`, {
            description: `Id "${entity.id}" may contain only letters, digits, and underscores.`,
        });
    }
    const slug = (0, slug_utils_1.generateSlug)(entity.name, FALLBACK_SLUGS[collection]);
    const pathSegment = `${slug}-${entity.id}`;
    if (pathSegment.length > MAX_PATH_SEGMENT_LENGTH) {
        throw new package_export_errors_1.PackageExportBlockedError(`${collection} entry "${entity.name}" creates a path segment longer than ${MAX_PATH_SEGMENT_LENGTH} characters. Shorten the entity name and retry the export.`, {
            description: `The generated path segment has ${pathSegment.length} characters.`,
        });
    }
    return { id: entity.id, name: entity.name, target: `${baseDir}/${pathSegment}` };
}
async function writeManifestEntry(writer, collection, baseDir, entity, serialized) {
    const entry = createManifestEntry(collection, baseDir, entity);
    await writer.writeDirectory(entry.target);
    await writer.writeFile(entityFilePath(collection, entry.target), (0, entity_file_format_1.formatEntityFile)(serialized));
    return entry;
}
async function writeWorkflowManifestEntry(writer, baseDir, workflow, content, metadata) {
    const entry = await writeManifestEntry(writer, 'workflows', baseDir, workflow, content);
    await writer.writeFile(workflowMetadataFilePath(entry.target), JSON.stringify(metadata, null, '\t'));
    return entry;
}
//# sourceMappingURL=manifest-entry.js.map