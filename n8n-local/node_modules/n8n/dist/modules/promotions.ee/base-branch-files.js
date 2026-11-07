"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_BRANCH_DIRECTORIES = void 0;
exports.parseBaseBranchFiles = parseBaseBranchFiles;
exports.parsePackageFiles = parsePackageFiles;
const manifest_entry_1 = require("../n8n-packages/io/manifest-entry");
const BASE_BRANCH_ENTITIES = {
    projects: { ...manifest_entry_1.PACKAGE_ENTITY_LAYOUT.projects, type: 'project', includeRoot: true },
    folders: { ...manifest_entry_1.PACKAGE_ENTITY_LAYOUT.folders, type: 'folder', includeRoot: false },
    workflows: { ...manifest_entry_1.PACKAGE_ENTITY_LAYOUT.workflows, type: 'workflow', includeRoot: false },
    credentials: { ...manifest_entry_1.PACKAGE_ENTITY_LAYOUT.credentials, type: 'credential', includeRoot: true },
    dataTables: { ...manifest_entry_1.PACKAGE_ENTITY_LAYOUT.dataTables, type: 'dataTable', includeRoot: true },
    variables: { ...manifest_entry_1.PACKAGE_ENTITY_LAYOUT.variables, type: 'variable', includeRoot: true },
    tags: { ...manifest_entry_1.PACKAGE_ENTITY_LAYOUT.tags, type: 'tag', includeRoot: true },
};
exports.BASE_BRANCH_DIRECTORIES = Object.values(BASE_BRANCH_ENTITIES)
    .filter(({ includeRoot }) => includeRoot)
    .map(({ directory }) => directory);
const ENTITIES_BY_DIRECTORY = new Map(Object.values(BASE_BRANCH_ENTITIES).map((entity) => [entity.directory, entity]));
function entityIdOfSegment(segment) {
    return segment.slice(segment.lastIndexOf('-') + 1);
}
function parseBaseBranchFiles(lsTreeOutput, options) {
    const files = lsTreeOutput.split('\0').flatMap((record) => {
        const tabIndex = record.indexOf('\t');
        if (tabIndex === -1)
            return [];
        const [, objectType, blobSha] = record.slice(0, tabIndex).split(' ');
        return objectType === 'blob' ? [{ path: record.slice(tabIndex + 1), blobSha }] : [];
    });
    return parsePackageFiles(files, options);
}
function parsePackageFiles(packageFiles, { exportRoot, projectId }) {
    const { projects, folders } = BASE_BRANCH_ENTITIES;
    const files = [];
    const rootPrefix = `${exportRoot}/`;
    for (const { path, blobSha } of packageFiles) {
        if (!path.startsWith(rootPrefix))
            continue;
        const segments = path.slice(rootPrefix.length).split('/');
        if (segments.length < 3)
            continue;
        if (segments[0] === projects.directory) {
            if (entityIdOfSegment(segments[1]) !== projectId)
                continue;
        }
        else if (!exports.BASE_BRANCH_DIRECTORIES.includes(segments[0])) {
            continue;
        }
        const fileName = segments[segments.length - 1];
        const entity = segments[0] === projects.directory &&
            segments[2] === folders.directory &&
            fileName === folders.fileName
            ? folders
            : ENTITIES_BY_DIRECTORY.get(segments[segments.length - 3]);
        if (!entity)
            continue;
        if (fileName !== entity.fileName)
            continue;
        const { type } = entity;
        const entitySegment = segments[segments.length - 2];
        files.push({
            entityId: entityIdOfSegment(entitySegment),
            slug: entitySegment.slice(0, entitySegment.lastIndexOf('-')),
            projectId: segments[0] === projects.directory ? projectId : null,
            fileName: entity.fileName,
            path,
            blobSha,
            type,
        });
    }
    return files;
}
//# sourceMappingURL=base-branch-files.js.map