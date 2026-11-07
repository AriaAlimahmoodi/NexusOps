import type { DiscoveryContext } from '../../types/discovery-types';
import type { PlanOutput } from '../../types/planning';
import type { SimpleWorkflow } from '../../types/workflow';
export declare function buildPlannerPrompt(options?: {
    hasDocumentationTool?: boolean;
}): string;
export interface PlannerContextOptions {
    userRequest: string;
    discoveryContext: DiscoveryContext;
    workflowJSON: SimpleWorkflow;
    planPrevious?: PlanOutput | null;
    planFeedback?: string | null;
    selectedNodesContext?: string;
}
export declare function buildPlannerContext(options: PlannerContextOptions): string;
