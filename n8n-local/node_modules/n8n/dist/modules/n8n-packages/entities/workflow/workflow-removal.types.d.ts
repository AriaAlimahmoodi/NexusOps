import type { WorkflowPlanItem } from './workflow-import.types';
import type { FolderConflictPolicy, OverwriteDeletionPolicy, PackageImportSource, WorkflowRemovalFailure, WorkflowRemovalConflict } from '../../n8n-packages.types';
export interface WorkflowRemovalRequest {
    folderConflictPolicy: FolderConflictPolicy;
    deletionPolicy: OverwriteDeletionPolicy;
    workflowItems: WorkflowPlanItem[];
    packageFolderIds: string[];
    subWorkflowRequirementIds?: string[];
    projectPendingCreation?: boolean;
    importSource?: PackageImportSource;
    explicitDeleteIds?: string[];
}
export interface RemovableWorkflow {
    id: string;
    name: string;
    parentFolderId: string | null;
}
export interface WorkflowRemovalPlan {
    removals: RemovableWorkflow[];
    failures: WorkflowRemovalFailure[];
    conflicts: WorkflowRemovalConflict[];
    deletionPolicy: OverwriteDeletionPolicy;
    occupiedFolderIds: string[];
}
