"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOLDER_SCAN_PROJECT_LIMIT = exports.FOLDER_CANDIDATE_LIMIT = exports.FOLDER_SCAN_LIMIT = void 0;
exports.normalizeFolderPath = normalizeFolderPath;
exports.listCandidatePaths = listCandidatePaths;
exports.resolveRequestedFolder = resolveRequestedFolder;
exports.FOLDER_SCAN_LIMIT = 200;
exports.FOLDER_CANDIDATE_LIMIT = 20;
exports.FOLDER_SCAN_PROJECT_LIMIT = 20;
function normalizeFolderPath(path) {
    return path
        .trim()
        .split('/')
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0)
        .join('/')
        .toLowerCase();
}
function listCandidatePaths(folders) {
    return folders
        .map((folder) => folder.path)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, exports.FOLDER_CANDIDATE_LIMIT);
}
function resolveRequestedFolder(requested, foldersInScope) {
    if (!foldersInScope)
        return { reason: 'unsupported', candidates: [] };
    const candidates = listCandidatePaths(foldersInScope);
    if (requested.folderId !== undefined) {
        const byId = foldersInScope.find((folder) => folder.id === requested.folderId);
        return byId ? { folderId: byId.id } : { reason: 'not-found', candidates };
    }
    const wanted = normalizeFolderPath(requested.folderPath ?? '');
    if (wanted.length === 0)
        return { reason: 'not-found', candidates };
    const wantedLeaf = wanted.split('/').at(-1) ?? wanted;
    const stages = [
        { matches: (folder) => normalizeFolderPath(folder.path) === wanted },
        { matches: (folder) => folder.name.trim().toLowerCase() === wanted },
        { matches: (folder) => normalizeFolderPath(folder.path).endsWith(`/${wanted}`) },
        { matches: (folder) => folder.name.trim().toLowerCase() === wantedLeaf, leafNameOnly: true },
    ];
    for (const stage of stages) {
        const hits = foldersInScope.filter(stage.matches);
        if (hits.length === 1 && !stage.leafNameOnly)
            return { folderId: hits[0].id };
        if (hits.length >= 1) {
            return { reason: 'ambiguous', candidates: listCandidatePaths(hits) };
        }
    }
    return { reason: 'not-found', candidates };
}
//# sourceMappingURL=instance-ai-folder-scope.js.map