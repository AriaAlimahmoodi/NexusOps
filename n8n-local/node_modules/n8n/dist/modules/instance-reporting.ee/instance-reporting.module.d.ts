import type { ModuleInterface } from '@n8n/decorators';
export declare class InstanceReportingModule implements ModuleInterface {
    init(): Promise<void>;
    systemTasks(): Promise<typeof import("./instance-reporting.task.js").InstanceReportingTask[]>;
    settings(): Promise<{
        enabled: boolean;
        reportTime?: undefined;
    } | {
        enabled: boolean;
        reportTime: string;
    }>;
    entities(): Promise<typeof import("./database/entities/instance-monitoring-report.js").InstanceMonitoringReport[]>;
    private isConfigured;
    private hasReceiver;
    private hasCredential;
}
