import type { DynamicStructuredTool } from '@langchain/core/tools';
import type { INodeTypeDescription } from 'n8n-workflow';
import type { WorkflowState } from '../workflow-state';
export interface LLMConfig {
    openAIApiKey?: string;
    model: string;
    temperature?: number;
}
export interface ParameterUpdaterOptions {
    nodeType: string;
    nodeDefinition: INodeTypeDescription;
    requestedChanges: string[];
}
export interface NodePromptConfig {
    nodeTypePatterns: {
        set: string[];
        if: string[];
        switch: string[];
        httpRequest: string[];
        tool: string[];
        gmail: string[];
    };
    parameterKeywords: {
        resourceLocator: string[];
        textExpressions: string[];
    };
    maxExamples: number;
    targetTokenBudget: number;
}
export interface PromptGenerationOptions {
    includeExamples?: boolean;
    maxExamples?: number;
    forceInclude?: {
        setNode?: boolean;
        ifNode?: boolean;
        httpRequest?: boolean;
        toolNodes?: boolean;
        resourceLocator?: boolean;
        textFields?: boolean;
    };
    tokenBudget?: number;
    verbose?: boolean;
}
export interface PromptBuilderContext {
    nodeType: string;
    nodeDefinition: INodeTypeDescription;
    requestedChanges: string[];
    hasResourceLocatorParams?: boolean;
    options?: PromptGenerationOptions;
    config?: NodePromptConfig;
}
export interface ToolExecutorOptions {
    state: typeof WorkflowState.State;
    toolMap: Map<string, DynamicStructuredTool>;
}
