import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';
import { RemoveMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { Logger } from '@n8n/backend-common';
import type { CoordinationLogEntry } from '../types/coordination';
import type { SimpleWorkflow } from '../types/workflow';
export type StateModificationAction = 'compact_messages' | 'delete_messages' | 'auto_compact_messages' | 'cleanup_dangling' | 'clear_error_state' | 'continue';
export interface StateModifierInput {
    messages: BaseMessage[];
    workflowJSON: SimpleWorkflow;
    previousSummary?: string;
    coordinationLog?: CoordinationLogEntry[];
}
export declare function determineStateAction(input: StateModifierInput, autoCompactThresholdTokens: number): StateModificationAction;
export declare function handleCleanupDangling(messages: BaseMessage[], logger?: Logger): {
    messages: RemoveMessage[];
};
export declare function handleCompactMessages(messages: BaseMessage[], previousSummary: string, llm: BaseChatModel, isAutoCompact: boolean, config?: RunnableConfig): Promise<{
    previousSummary: string;
    messages: BaseMessage[];
    coordinationLog: CoordinationLogEntry[];
}>;
export declare function handleDeleteMessages(messages: BaseMessage[]): {
    messages: RemoveMessage[];
    workflowJSON: SimpleWorkflow;
    previousSummary: string;
    discoveryContext: null;
    coordinationLog: CoordinationLogEntry[];
    workflowOperations: [];
};
export declare function handleClearErrorState(coordinationLog: CoordinationLogEntry[], logger?: Logger): {
    coordinationLog: CoordinationLogEntry[];
};
export declare function handleCreateWorkflowName(messages: BaseMessage[], workflowJSON: SimpleWorkflow, llm: BaseChatModel, logger?: Logger, config?: RunnableConfig): Promise<{
    workflowJSON: SimpleWorkflow;
}>;
