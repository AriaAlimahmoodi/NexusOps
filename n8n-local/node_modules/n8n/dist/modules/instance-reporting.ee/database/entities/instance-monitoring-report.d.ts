import { WithTimestamps } from '@n8n/db';
export type InstanceReportDataPoint = {
    kind: 'cumulative';
    name: string;
    value: number;
} | {
    kind: 'daily';
    name: string;
    value: number;
    date: string;
};
export type InstanceReportStatus = 'pending' | 'sending' | 'delivered' | 'skipped_after_max_retries';
export declare class InstanceMonitoringReport extends WithTimestamps {
    id: string;
    reportDate: string | null;
    dataPoints: InstanceReportDataPoint[];
    status: InstanceReportStatus;
    deliveredAt: Date | null;
    attempts: number;
    lastAttemptAt: Date | null;
    lastError: string | null;
}
