import type { ProjectPlannedAction } from './project-import.types';
import type { ProjectConflictPolicy } from '../../n8n-packages.types';
export interface MatchedProjectDecision {
    action: Extract<ProjectPlannedAction, 'update' | 'skip'>;
    blocked: boolean;
}
export declare function decideMatchedProject(policy: ProjectConflictPolicy): MatchedProjectDecision;
