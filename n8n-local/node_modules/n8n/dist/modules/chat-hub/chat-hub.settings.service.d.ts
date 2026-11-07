import { ChatHubConversationModel, ChatHubLLMProvider, ChatProviderSettingsDto, type ChatHubSemanticSearchSettings } from '@n8n/api-types';
import { SettingsRepository } from '@n8n/db';
import type { EntityManager } from '@n8n/db';
import type { SemanticSearchOptions } from './chat-hub.types';
export declare class ChatHubSettingsService {
    private readonly settingsRepository;
    constructor(settingsRepository: SettingsRepository);
    getEnabled(): Promise<boolean>;
    setEnabled(enabled: boolean): Promise<void>;
    ensureModelIsAllowed(model: ChatHubConversationModel, trx?: EntityManager): Promise<void>;
    getProviderSettings(provider: ChatHubLLMProvider, trx?: EntityManager): Promise<ChatProviderSettingsDto>;
    getAllProviderSettings(): Promise<Record<ChatHubLLMProvider, ChatProviderSettingsDto>>;
    getSemanticSearchSettings(): Promise<ChatHubSemanticSearchSettings>;
    setProviderSettings(provider: ChatHubLLMProvider, settings: ChatProviderSettingsDto): Promise<void>;
    setSemanticSearchSettings(settings: ChatHubSemanticSearchSettings): Promise<void>;
    getSemanticSearchOptions(): Promise<SemanticSearchOptions | null>;
}
