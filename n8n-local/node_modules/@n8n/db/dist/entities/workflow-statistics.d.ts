import { StatisticsNames } from './types-db';
export declare class WorkflowStatistics {
    id: number;
    count: number;
    rootCount: number;
    latestEvent: Date;
    name: StatisticsNames;
    workflowId: string;
    workflowName: string | null;
}
