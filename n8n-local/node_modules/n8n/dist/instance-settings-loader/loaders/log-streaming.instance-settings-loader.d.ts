import { Logger } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { EventDestinationsRepository } from '../../modules/log-streaming.ee/database/repositories/event-destination.repository';
export declare class LogStreamingInstanceSettingsLoader {
    private readonly config;
    private readonly eventDestinationsRepository;
    private logger;
    constructor(config: InstanceSettingsLoaderConfig, eventDestinationsRepository: EventDestinationsRepository, logger: Logger);
    run(): Promise<'created' | 'skipped'>;
    private parseAndValidate;
    private replace;
}
