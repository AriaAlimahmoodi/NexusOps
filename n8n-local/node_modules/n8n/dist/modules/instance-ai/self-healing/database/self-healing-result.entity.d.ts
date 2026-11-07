import type { SelfHealingResultOutcome, SelfHealingResultUsage } from '@n8n/api-types';
import { Project, User, WorkflowEntity, WithTimestampsAndStringId } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { WorkflowSuggestion } from '../../workflow-suggestions/database/workflow-suggestion.entity';
export declare class SelfHealingResult extends WithTimestampsAndStringId {
    workflowId: string;
    workflow: Relation<WorkflowEntity>;
    projectId: string;
    project: Relation<Project>;
    backgroundUserId: string;
    backgroundUser: Relation<User>;
    outcome: SelfHealingResultOutcome;
    summary: string;
    report: string;
    completedAt: Date;
    executionId: string;
    suggestionId: string | null;
    suggestion: Relation<WorkflowSuggestion> | null;
    usage: SelfHealingResultUsage;
    dismissedAt: Date | null;
    dismissedById: string | null;
    dismissedBy: Relation<User> | null;
}
