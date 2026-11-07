import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
export declare class DeprecationService {
    private readonly logger;
    private readonly globalConfig;
    private readonly instanceSettings;
    private readonly deprecations;
    private readonly state;
    constructor(logger: Logger, globalConfig: GlobalConfig, instanceSettings: InstanceSettings);
    warn(): void;
}
