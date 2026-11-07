import { FolderService } from '../../../../services/folder.service';
import type { FolderImportContext, FolderImportPlan, PreparedFolder } from './folder-import.types';
import type { ImportedFolderSummary } from '../../n8n-packages.types';
export declare class FolderImporter {
    private readonly folderService;
    constructor(folderService: FolderService);
    plan(context: FolderImportContext, folders: PreparedFolder[]): Promise<FolderImportPlan>;
    apply(context: FolderImportContext, plan: FolderImportPlan): Promise<ImportedFolderSummary[]>;
    private findExisting;
}
