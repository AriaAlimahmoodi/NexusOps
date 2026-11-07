import { Logger } from '@n8n/backend-common';
import { SettingsRepository } from '@n8n/db';
import { InsightsConfig } from '@n8n/backend-module-insights/config';
export declare class InstanceReportingSettingsService {
    private readonly settingsRepository;
    private readonly insightsConfig;
    private readonly logger;
    constructor(settingsRepository: SettingsRepository, insightsConfig: InsightsConfig, logger: Logger);
    getReportTime(): Promise<string>;
    private clearCompactionWindow;
    private compactionFloorMinutes;
    private randomReportTime;
    private persistReportTime;
    private readReportTime;
}
