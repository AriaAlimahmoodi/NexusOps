import type { ToolRunnableConfig } from '@langchain/core/tools';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { ToolError, ProgressReporter, BatchReporter } from '../../types/tools';
export declare function createProgressReporter<TToolName extends string = string>(config: ToolRunnableConfig & LangGraphRunnableConfig, toolName: TToolName, displayTitle: string, customTitle?: string): ProgressReporter;
export declare function reportStart<T>(reporter: ProgressReporter, input: T): void;
export declare function reportProgress(reporter: ProgressReporter, message: string, data?: Record<string, unknown>): void;
export declare function reportComplete<T>(reporter: ProgressReporter, output: T): void;
export declare function reportError(reporter: ProgressReporter, error: ToolError): void;
export declare function createBatchProgressReporter(reporter: ProgressReporter, scope: string): BatchReporter;
