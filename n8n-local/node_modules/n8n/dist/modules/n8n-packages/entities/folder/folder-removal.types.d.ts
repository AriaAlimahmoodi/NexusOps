import type { FolderRemovalFailure } from '../../n8n-packages.types';
export interface RemovableFolder {
    id: string;
    name: string;
    parentFolderId: string | null;
    depth: number;
}
export interface FolderRemovalPlan {
    removals: RemovableFolder[];
    failures: FolderRemovalFailure[];
}
