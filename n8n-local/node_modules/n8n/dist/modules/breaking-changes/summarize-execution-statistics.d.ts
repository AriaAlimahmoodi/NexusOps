import type { WorkflowStatistics } from '@n8n/db';
export interface ExecutionSummary {
    numberOfExecutions: number;
    lastExecutedAt?: Date;
}
export declare function summarizeExecutionStatistics(statistics: WorkflowStatistics[]): ExecutionSummary;
