import type { DesiredJob, Schedule } from '@n8n/scheduler';
export declare function nameDesiredJobs(workflowId: string, nodeId: string, schedules: Array<{
    schedule: Schedule;
    firstRunAt: Date | null;
}>): DesiredJob[];
