import { Logger } from '@n8n/backend-common';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import { McpSettingsService } from '../../modules/mcp/mcp.settings.service';
export declare class McpSettingsLoader {
    private readonly instanceSettingsLoaderConfig;
    private readonly mcpSettingsService;
    private logger;
    constructor(instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig, mcpSettingsService: McpSettingsService, logger: Logger);
    run(): Promise<'created' | 'skipped'>;
}
