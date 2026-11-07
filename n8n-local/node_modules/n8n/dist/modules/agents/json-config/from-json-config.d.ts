import type { AgentMessage, BuiltMemory, BuiltProviderTool, BuiltTool, CredentialProvider, FetchFn, McpClient, ModelConfig, ToolDescriptor, Agent as RuntimeAgent } from '@n8n/agents';
import { type AgentSkill, type AgentJsonConfig, type AgentJsonMcpServerConfig, type AgentJsonMemoryConfig, type AgentJsonToolConfig } from '@n8n/api-types';
import { z } from 'zod';
import { type ManagedEmbeddingProviderOptions, type ManagedEmbeddingProviderOptionsResolver } from './embedding-credential';
export type { ManagedEmbeddingProviderOptions, ManagedEmbeddingProviderOptionsResolver };
declare const WEB_SEARCH_INPUT_SCHEMA: z.ZodObject<{
    query: z.ZodString;
    maxResults: z.ZodOptional<z.ZodNumber>;
    includeDomains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    excludeDomains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    query: string;
    maxResults?: number | undefined;
    includeDomains?: string[] | undefined;
    excludeDomains?: string[] | undefined;
}, {
    query: string;
    maxResults?: number | undefined;
    includeDomains?: string[] | undefined;
    excludeDomains?: string[] | undefined;
}>;
export type FallbackWebSearchArgs = z.infer<typeof WEB_SEARCH_INPUT_SCHEMA>;
export type FallbackWebSearchHandler = (args: FallbackWebSearchArgs) => Promise<unknown>;
export type ToolResolver = (toolSchema: AgentJsonToolConfig) => Promise<BuiltTool | null | undefined>;
export interface ToolExecutor {
    executeTool(toolName: string, input: unknown, ctx: unknown): Promise<unknown>;
    executeToMessage(toolName: string, output: unknown): Promise<AgentMessage | undefined>;
}
export type MemoryFactory = (params: AgentJsonMemoryConfig) => BuiltMemory | Promise<BuiltMemory>;
export type McpClientBuilder = (server: AgentJsonMcpServerConfig) => Promise<McpClient>;
export interface BuildFromJsonOptions {
    toolExecutor: ToolExecutor;
    credentialProvider: CredentialProvider;
    resolveTool?: ToolResolver;
    skills?: Record<string, AgentSkill>;
    memoryFactory: MemoryFactory;
    buildMcpClient?: McpClientBuilder;
    resolveManagedEmbeddingProviderOptions?: ManagedEmbeddingProviderOptionsResolver;
    modelFetch?: FetchFn;
    webSearchFetch?: FetchFn;
    fallbackWebSearch?: FallbackWebSearchHandler;
    attachAuthPendingMcpServers?: boolean;
    previewChat?: boolean;
}
export declare function buildFromJson(config: AgentJsonConfig, toolDescriptors: Record<string, ToolDescriptor>, options: BuildFromJsonOptions): Promise<RuntimeAgent>;
export declare function buildProviderToolsForModel(config: AgentJsonConfig, modelConfig: ModelConfig): BuiltProviderTool[];
