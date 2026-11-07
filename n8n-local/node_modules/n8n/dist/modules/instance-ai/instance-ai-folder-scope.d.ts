import type { FolderResolutionFailure } from '@n8n/instance-ai';
export declare const FOLDER_SCAN_LIMIT = 200;
export declare const FOLDER_CANDIDATE_LIMIT = 20;
export declare const FOLDER_SCAN_PROJECT_LIMIT = 20;
export interface FolderInScope {
    id: string;
    name: string;
    path: string;
    projectId: string;
}
export declare function normalizeFolderPath(path: string): string;
export declare function listCandidatePaths(folders: FolderInScope[]): string[];
export declare function resolveRequestedFolder(requested: {
    folderPath?: string;
    folderId?: string;
}, foldersInScope: FolderInScope[] | undefined): {
    folderId: string;
} | Omit<FolderResolutionFailure, 'requested'>;
