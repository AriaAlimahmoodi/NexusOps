import type { InstanceReportingStatus } from '@n8n/api-types';
import { InstanceMonitoringReportRepository } from './database/repositories/instance-monitoring-report.repository';
export declare class InstanceReportingController {
    private readonly reportRepository;
    constructor(reportRepository: InstanceMonitoringReportRepository);
    getStatus(): Promise<InstanceReportingStatus>;
}
