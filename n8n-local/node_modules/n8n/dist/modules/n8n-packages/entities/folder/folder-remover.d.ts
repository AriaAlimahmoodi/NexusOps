import { FolderService } from '../../../../services/folder.service';
import { ProjectService } from '../../../../services/project.service.ee';
import type { FolderRemovalPlan } from './folder-removal.types';
import type { ImportContext, RemovedFolderSummary } from '../../n8n-packages.types';
export declare class FolderRemover {
    private readonly folderService;
    private readonly projectService;
    constructor(folderService: FolderService, projectService: ProjectService);
    plan(context: ImportContext, input: {
        packageFolderIds: string[];
        occupiedFolderIds: string[];
    }): Promise<FolderRemovalPlan>;
    apply(context: ImportContext, plan: FolderRemovalPlan): Promise<RemovedFolderSummary[]>;
}
