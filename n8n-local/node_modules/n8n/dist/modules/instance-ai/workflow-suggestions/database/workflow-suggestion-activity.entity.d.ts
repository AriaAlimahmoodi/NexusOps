import type { WorkflowSuggestionActivity as WorkflowSuggestionActivityDto } from '@n8n/api-types';
import { User, WithTimestampsAndStringId } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { WorkflowSuggestion } from './workflow-suggestion.entity';
export declare class WorkflowSuggestionActivity extends WithTimestampsAndStringId {
    suggestionId: string;
    suggestion: Relation<WorkflowSuggestion>;
    action: WorkflowSuggestionActivityDto['action'];
    author: WorkflowSuggestionActivityDto['author'];
    actorId: string | null;
    actor: Relation<User> | null;
}
