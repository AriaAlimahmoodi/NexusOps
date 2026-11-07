declare const ChatModelsRequestDto_base: import("@n8n/api-types").ZodClass<{
    credentials: Partial<Record<"anthropic" | "awsBedrock" | "azureEntraId" | "azureOpenAi" | "cohere" | "custom-agent" | "deepSeek" | "google" | "groq" | "mistralCloud" | "n8n" | "nvidia" | "ollama" | "openRouter" | "openai" | "vercelAiGateway" | "xAiGrok", string | null>>;
}, {
    credentials: import("zod").ZodRecord<import("zod").ZodEnum<["openai", "anthropic", "google", "azureOpenAi", "azureEntraId", "ollama", "awsBedrock", "vercelAiGateway", "xAiGrok", "groq", "openRouter", "deepSeek", "cohere", "mistralCloud", "nvidia", "n8n", "custom-agent"]>, import("zod").ZodNullable<import("zod").ZodString>>;
}>;
export declare class ChatModelsRequestDto extends ChatModelsRequestDto_base {
}
export {};
