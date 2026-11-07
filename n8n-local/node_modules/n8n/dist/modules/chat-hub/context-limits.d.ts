import type { ChatHubLLMProvider } from '@n8n/api-types';
export declare const maxContextWindowTokens: Record<ChatHubLLMProvider, Record<string, number>>;
export declare const getMaxContextWindowTokens: (provider: ChatHubLLMProvider, model: string) => number | undefined;
