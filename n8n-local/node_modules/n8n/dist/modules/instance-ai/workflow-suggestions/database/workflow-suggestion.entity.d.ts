import type { WorkflowSuggestionContent, WorkflowSuggestionBaseline, WorkflowSuggestionAppliedVersion } from '@n8n/api-types';
import { Project, User, WorkflowEntity, WithTimestampsAndStringId } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
export declare class WorkflowSuggestion extends WithTimestampsAndStringId {
    workflowId: string;
    workflow: Relation<WorkflowEntity>;
    projectId: string;
    project: Relation<Project>;
    backgroundUserId: string;
    backgroundUser: Relation<User>;
    expectedBaseline: WorkflowSuggestionBaseline['expectedBaseline'];
    state: 'pending' | 'closed';
    closedReason: 'outdated' | 'applied' | 'discarded' | null;
    closedAt: Date | null;
    resultKind: 'fix_ready' | 'needs_you';
    appliedVersionId: string | null;
    appliedChecksum: string | null;
    appliedAction: WorkflowSuggestionAppliedVersion['action'] | null;
    appliedActorId: string | null;
    payload: WorkflowSuggestionContent;
}
