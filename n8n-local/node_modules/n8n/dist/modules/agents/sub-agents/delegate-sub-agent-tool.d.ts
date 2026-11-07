import { type CreateDelegateSubAgentToolOptions, type InlineSubAgentProviderToolsResolver, type ModelConfig, type SubAgentTaskDifficulty } from '@n8n/agents';
import type { BudgetGuardrailConfig, SubAgentRunPolicy, SubAgentSource } from '@n8n/api-types';
import type { SubAgentRunContext, SubAgentRunner } from './sub-agent-runner';
export interface CreateN8nDelegateSubAgentToolOptions extends SubAgentRunContext {
    runner: SubAgentRunner;
    parentBudget?: BudgetGuardrailConfig;
    sourcesById: Record<string, SubAgentSource>;
    availableSubAgents?: NonNullable<CreateDelegateSubAgentToolOptions['availableSubAgents']>;
    policy?: SubAgentRunPolicy;
    inlineSubAgentModelsByDifficulty?: Partial<Record<SubAgentTaskDifficulty, ModelConfig>>;
    resolveInlineSubAgentProviderTools?: InlineSubAgentProviderToolsResolver;
    runBackgroundSubAgent?: CreateDelegateSubAgentToolOptions['runBackgroundSubAgent'];
}
export declare function createN8nDelegateSubAgentTool(options: CreateN8nDelegateSubAgentToolOptions): import("@n8n/agents").BuiltTool;
