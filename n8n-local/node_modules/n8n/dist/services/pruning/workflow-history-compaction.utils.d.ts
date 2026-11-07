import type { GlobalConfig, WorkflowHistoryCompactionConfig } from '@n8n/config';
export declare function getCompactionWindowDeltas(minimumAge: number, timeWindow: number, unitMs: number): {
    startDelta: number;
    endDelta: number;
};
export declare function isTrimmingEnabled(workflowHistory: GlobalConfig['workflowHistory'], compaction: WorkflowHistoryCompactionConfig): boolean;
