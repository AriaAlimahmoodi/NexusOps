import type { ToolRunnableConfig } from '@langchain/core/tools';
import { Command } from '@langchain/langgraph';
import type { ToolError } from '../../types/tools';
import type { StateUpdater } from '../../types/utils';
import type { WorkflowState } from '../../workflow-state';
export declare function createSuccessResponse<TState = typeof WorkflowState.State>(config: ToolRunnableConfig, message: string, stateUpdates?: StateUpdater<TState>): Command;
export declare function createErrorResponse<TState = typeof WorkflowState.State>(config: ToolRunnableConfig, error: ToolError, stateUpdates?: StateUpdater<TState>): Command;
