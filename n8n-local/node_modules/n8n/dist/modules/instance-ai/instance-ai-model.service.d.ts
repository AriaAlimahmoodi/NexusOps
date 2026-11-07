import { type InstanceAiCredits, type ProxyContext } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { OutboundHttp } from '@n8n/backend-network';
import type { User } from '@n8n/db';
import type { ModelConfig } from '@n8n/instance-ai';
import { AiService } from '../../services/ai.service';
import { ProxyTokenManager } from '../../services/proxy-token-manager';
import { InstanceAiSettingsService } from './instance-ai-settings.service';
export declare class InstanceAiModelService {
    private readonly settingsService;
    private readonly aiService;
    private readonly outboundHttp;
    private readonly logger;
    constructor(settingsService: InstanceAiSettingsService, aiService: AiService, outboundHttp: OutboundHttp, logger: Logger);
    isProxyEnabled(): boolean;
    resolveAgentModelConfig(user: User, proxyContext?: ProxyContext): Promise<ModelConfig>;
    resolveMemoryModelConfig(user: User, mainModel: ModelConfig, run: {
        proxyBaseUrl?: string;
        tokenManager?: ProxyTokenManager;
        proxyContext?: ProxyContext;
    }): Promise<ModelConfig | undefined>;
    resolveProxyModel(user: User, proxyBaseUrl: string, tokenManager: ProxyTokenManager, proxyContext?: ProxyContext, modelName?: string): Promise<ModelConfig>;
    private resolveHttpProxyModel;
    getCredits(user: User): Promise<InstanceAiCredits>;
}
