import type { ProcessInternals } from '@n8n/api-types';
import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
export declare class ProcessInternalsService {
    private readonly instanceSettings;
    private readonly globalConfig;
    constructor(instanceSettings: InstanceSettings, globalConfig: GlobalConfig);
    collect(): ProcessInternals;
}
