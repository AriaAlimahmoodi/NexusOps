import type { ModuleInterface } from '@n8n/decorators';
export declare class ChatHubModule implements ModuleInterface {
    init(): Promise<void>;
    settings(): Promise<{
        enabled: boolean;
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
        semanticSearch: import("@n8n/api-types").ChatHubSemanticSearchSettings;
        agentUploadMaxSizeMb: number;
    }>;
    entities(): Promise<(typeof import("./chat-hub-tool.entity.js").ChatHubTool | typeof import("./chat-hub-agent.entity.js").ChatHubAgent | typeof import("./chat-hub-session.entity.js").ChatHubSession | typeof import("./chat-hub-message.entity.js").ChatHubMessage)[]>;
    shutdown(): Promise<void>;
}
