import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { PrometheusMetricsConfig } from '@n8n/config';
export declare class McpPostSaveMetricsService {
    private readonly config;
    private readonly eventService;
    private readonly logger;
    constructor(config: PrometheusMetricsConfig, eventService: EventService, logger: Logger);
    incrementPostSaveFailure(tool: 'create' | 'update', error: unknown): void;
}
