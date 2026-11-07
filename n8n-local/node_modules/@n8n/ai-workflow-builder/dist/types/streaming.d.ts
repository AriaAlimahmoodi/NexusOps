import type { PlanOutput, PlannerQuestion } from './planning';
export interface AgentMessageChunk {
    role: 'assistant';
    type: 'message';
    text: string;
    codeSnippet?: string;
}
export interface ToolProgressChunk {
    type: 'tool';
    toolName: string;
    status: string;
    [key: string]: unknown;
}
export interface WorkflowUpdateChunk {
    role: 'assistant';
    type: 'workflow-updated';
    codeSnippet: string;
    iterationCount?: number;
    sourceCode?: string;
}
export interface ExecutionRequestChunk {
    role: 'assistant';
    type: 'execution-requested';
    reason: string;
}
export interface QuestionsChunk {
    role: 'assistant';
    type: 'questions';
    introMessage?: string;
    questions: PlannerQuestion[];
}
export interface PlanChunk {
    role: 'assistant';
    type: 'plan';
    plan: PlanOutput;
}
export interface SessionMessagesChunk {
    type: 'session-messages';
    messages: unknown[];
}
export interface CodeDiffChunk {
    role: 'assistant';
    type: 'code-diff';
    suggestionId: string;
    sdkSessionId: string;
    codeDiff?: string;
    description?: string;
    nodeName?: string;
    quickReplies?: unknown[];
}
export interface MessagesCompactedChunk {
    type: 'messages-compacted';
}
export interface SummaryChunk {
    role: 'assistant';
    type: 'summary';
    title: string;
    content: string;
}
export interface AgentSuggestionChunk {
    role: 'assistant';
    type: 'agent-suggestion';
    title: string;
    text: string;
    suggestionId?: string;
}
export interface WebFetchApprovalChunk {
    role: 'assistant';
    type: 'web_fetch_approval';
    requestId: string;
    url: string;
    domain: string;
}
export type StreamChunk = AgentMessageChunk | ToolProgressChunk | WorkflowUpdateChunk | ExecutionRequestChunk | SessionMessagesChunk | QuestionsChunk | PlanChunk | CodeDiffChunk | MessagesCompactedChunk | SummaryChunk | AgentSuggestionChunk | WebFetchApprovalChunk;
export interface StreamOutput {
    messages: StreamChunk[];
    interruptId?: string;
}
export interface StreamProcessorConfig {
    threadConfig: {
        configurable: {
            thread_id: string;
        };
    };
    workflowUpdateTools?: string[];
}
