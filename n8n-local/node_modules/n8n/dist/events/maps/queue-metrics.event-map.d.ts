import type { ExecutionStatus } from 'n8n-workflow';
export type QueueMetricsEventMap = {
    'job-counts-updated': {
        active: number;
        completed: number;
        failed: number;
        waiting: number;
    };
    'job-completion-missed': {
        status: ExecutionStatus | 'deleted';
    };
};
