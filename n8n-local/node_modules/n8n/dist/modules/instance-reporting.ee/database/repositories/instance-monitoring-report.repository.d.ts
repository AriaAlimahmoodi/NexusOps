import { DataSource, Repository } from '@n8n/typeorm';
import type { InstanceReportDataPoint } from '../entities/instance-monitoring-report';
import { InstanceMonitoringReport } from '../entities/instance-monitoring-report';
export declare class InstanceMonitoringReportRepository extends Repository<InstanceMonitoringReport> {
    constructor(dataSource: DataSource);
    findPending(): Promise<InstanceMonitoringReport | null>;
    readDbNow(): Promise<Date>;
    claimForSend(id: string): Promise<Date | null>;
    releaseStaleSend(id: string, startedAt: Date | null): Promise<boolean>;
    hasSettledToday(now: Date): Promise<boolean>;
    createPending(dataPoints: InstanceReportDataPoint[], now: Date): Promise<InstanceMonitoringReport | null>;
    findLastCoveredDay(): Promise<string | null>;
    findLastDeliveryTime(): Promise<Date | null>;
    markDelivered(id: string, deliveredAt: Date): Promise<boolean>;
    recordFailure(id: string, claimedAt: Date, error: string, failedAt: Date): Promise<boolean>;
    markSkipped(id: string): Promise<boolean>;
}
