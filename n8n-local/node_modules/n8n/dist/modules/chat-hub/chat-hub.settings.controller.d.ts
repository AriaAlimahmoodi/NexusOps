import { ChatHubLLMProvider, UpdateChatSettingsRequest, UpdateChatEnabledRequest, ChatHubSemanticSearchSettings } from '@n8n/api-types';
import { ModuleRegistry, Logger } from '@n8n/backend-common';
import { type AuthenticatedRequest } from '@n8n/db';
import { ChatHubSettingsService } from './chat-hub.settings.service';
export declare class ChatHubSettingsController {
    private readonly settings;
    private readonly logger;
    private readonly moduleRegistry;
    constructor(settings: ChatHubSettingsService, logger: Logger, moduleRegistry: ModuleRegistry);
    private syncModuleSettings;
    getSettings(_req: AuthenticatedRequest, _res: Response): Promise<{
        providers: Record<"anthropic" | "awsBedrock" | "azureEntraId" | "azureOpenAi" | "cohere" | "deepSeek" | "google" | "groq" | "mistralCloud" | "nvidia" | "ollama" | "openRouter" | "openai" | "vercelAiGateway" | "xAiGrok", {
            provider: "anthropic" | "awsBedrock" | "azureEntraId" | "azureOpenAi" | "cohere" | "deepSeek" | "google" | "groq" | "mistralCloud" | "nvidia" | "ollama" | "openRouter" | "openai" | "vercelAiGateway" | "xAiGrok";
            enabled?: boolean | undefined;
            credentialId: string | null;
            allowedModels: {
                displayName: string;
                model: string;
                isManual?: boolean | undefined;
            }[];
            responsesApiEnabled?: boolean | undefined;
            contextWindowLength?: number | undefined;
            createdAt: string;
            updatedAt: string | null;
        }>;
    }>;
    getProviderSettings(_req: AuthenticatedRequest, _res: Response, provider: ChatHubLLMProvider): Promise<{
        settings: {
            provider: "anthropic" | "awsBedrock" | "azureEntraId" | "azureOpenAi" | "cohere" | "deepSeek" | "google" | "groq" | "mistralCloud" | "nvidia" | "ollama" | "openRouter" | "openai" | "vercelAiGateway" | "xAiGrok";
            enabled?: boolean | undefined;
            credentialId: string | null;
            allowedModels: {
                displayName: string;
                model: string;
                isManual?: boolean | undefined;
            }[];
            responsesApiEnabled?: boolean | undefined;
            contextWindowLength?: number | undefined;
            createdAt: string;
            updatedAt: string | null;
        };
    }>;
    updateSettings(_req: AuthenticatedRequest, _res: Response, body: UpdateChatSettingsRequest): Promise<{
        provider: "anthropic" | "awsBedrock" | "azureEntraId" | "azureOpenAi" | "cohere" | "deepSeek" | "google" | "groq" | "mistralCloud" | "nvidia" | "ollama" | "openRouter" | "openai" | "vercelAiGateway" | "xAiGrok";
        enabled?: boolean | undefined;
        credentialId: string | null;
        allowedModels: {
            displayName: string;
            model: string;
            isManual?: boolean | undefined;
        }[];
        responsesApiEnabled?: boolean | undefined;
        contextWindowLength?: number | undefined;
        createdAt: string;
        updatedAt: string | null;
    }>;
    setEnabled(_req: AuthenticatedRequest, _res: Response, body: UpdateChatEnabledRequest): Promise<{
        enabled: boolean;
    }>;
    setVectorStoreCredential(_req: AuthenticatedRequest, _res: Response, body: ChatHubSemanticSearchSettings): Promise<void>;
}
