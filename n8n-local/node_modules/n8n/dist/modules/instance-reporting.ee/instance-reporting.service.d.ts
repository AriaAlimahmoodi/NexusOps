import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import { EventService } from '@n8n/backend-services';
import { LicenseMetricsRepository } from '@n8n/db';
import { InstanceSettings } from 'n8n-core';
import { License } from '../../license';
import { InsightsService } from '@n8n/backend-module-insights';
import { InsightsConfig } from '@n8n/backend-module-insights/config';
import type { InstanceMonitoringReport } from './database/entities/instance-monitoring-report';
import { InstanceMonitoringReportRepository } from './database/repositories/instance-monitoring-report.repository';
import { InstanceReportingSettingsService } from './instance-reporting-settings.service';
import { InstanceReportingConfig } from './instance-reporting.config';
export interface DueReportWork {
    expiredReport: InstanceMonitoringReport | null;
    reportDue: boolean;
    slot: Date | null;
}
export declare class InstanceReportingService {
    private readonly config;
    private readonly reportRepository;
    private readonly settingsService;
    private readonly insightsService;
    private readonly insightsConfig;
    private readonly instanceSettings;
    private readonly licenseMetricsRepository;
    private readonly license;
    private readonly logger;
    private readonly eventService;
    private readonly http;
    constructor(config: InstanceReportingConfig, reportRepository: InstanceMonitoringReportRepository, settingsService: InstanceReportingSettingsService, insightsService: InsightsService, insightsConfig: InsightsConfig, instanceSettings: InstanceSettings, licenseMetricsRepository: LicenseMetricsRepository, license: License, logger: Logger, eventService: EventService, outboundHttp: OutboundHttp);
    findDueWork(now: Date): Promise<DueReportWork>;
    sendDueReport(now: Date): Promise<void>;
    sendReport(slot: Date | null): Promise<void>;
    private findOrCreateReport;
    private deliverReport;
    private skip;
    private missedDays;
    private firstOwedDay;
    private collectDataPoints;
    private readDays;
}
