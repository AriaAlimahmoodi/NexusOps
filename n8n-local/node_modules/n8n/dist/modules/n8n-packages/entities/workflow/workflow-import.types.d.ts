import type { WorkflowEntity } from '@n8n/db';
import type { WorkflowArchiveTransition } from './workflow-archive-transition';
import type { WorkflowIdConflict, WorkflowLineageConflict } from './workflow-import-match.service';
import type { WorkflowPublishingBlockedReason, WorkflowPublishingOutcome } from './workflow-publishing-policy.types';
import type { ImportContext } from '../../n8n-packages.types';
export interface WorkflowImportContext extends ImportContext {
    droppedTagIds: ReadonlySet<string>;
}
export interface PreparedWorkflow {
    entity: WorkflowEntity;
    sourceWorkflowId: string;
    sourcePublished?: boolean;
    sourceArchived: boolean;
    parentFolderId: string | null;
    tagIds?: string[];
}
export type WorkflowPlannedAction = 'create' | 'update' | 'skip';
export interface WorkflowDecision {
    action: WorkflowPlannedAction;
    blocked: boolean;
}
export type WorkflowPlanItem = ({
    action: 'create';
    decidedId: string;
} & PreparedWorkflow) | ({
    action: 'update';
    existing: WorkflowEntity;
    archiveTransition: WorkflowArchiveTransition | null;
} & PreparedWorkflow) | ({
    action: 'skip';
    existing: WorkflowEntity;
} & PreparedWorkflow);
export type PersistedWorkflowPlanItem = Extract<WorkflowPlanItem, {
    action: 'create' | 'update';
}>;
export interface WorkflowConflict {
    sourceWorkflowId: string;
    existingWorkflowId: string;
    name: string;
}
export interface WorkflowFolderConflict {
    sourceWorkflowId: string;
    existingWorkflowId: string;
    existingParentFolderId: string | null;
    targetFolderId: string;
    name: string;
}
export interface WorkflowArchiveForbidden {
    sourceWorkflowId: string;
    existingWorkflowId: string;
    name: string;
    projectId: string;
    transition: WorkflowArchiveTransition;
}
export interface WorkflowImportPlan {
    items: WorkflowPlanItem[];
    conflicts: WorkflowConflict[];
    lineageConflicts: WorkflowLineageConflict[];
    idConflicts: WorkflowIdConflict[];
    folderConflicts: WorkflowFolderConflict[];
    archiveForbidden: WorkflowArchiveForbidden[];
}
export interface WorkflowImportOutcome {
    status: 'created' | 'updated' | 'skipped';
    workflow: WorkflowEntity;
    sourceWorkflowId: string;
    publishing: WorkflowPublishingOutcome;
}
export type PersistedWorkflowOutcome = {
    status: 'skipped';
    workflow: WorkflowEntity;
    sourceWorkflowId: string;
} | {
    status: 'created' | 'updated';
    workflow: WorkflowEntity;
    sourceWorkflowId: string;
    item: PersistedWorkflowPlanItem;
    blockedFromPublish?: WorkflowPublishingBlockedReason;
};
