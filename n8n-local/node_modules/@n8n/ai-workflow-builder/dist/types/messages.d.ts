export interface QuickReplyOption {
    text: string;
    type: string;
    isFeedback?: boolean;
}
export interface AssistantChatMessage {
    role: 'assistant';
    type: 'message';
    text: string;
    step?: string;
    codeSnippet?: string;
}
export interface AssistantSummaryMessage {
    role: 'assistant';
    type: 'summary';
    title: string;
    content: string;
}
export interface EndSessionMessage {
    role: 'assistant';
    type: 'event';
    eventName: 'end-session';
}
export interface AgentChatMessage {
    role: 'assistant';
    type: 'agent-suggestion';
    title: string;
    text: string;
}
export type MessageResponse = ((AssistantChatMessage | AssistantSummaryMessage | AgentChatMessage) & {
    quickReplies?: QuickReplyOption[];
}) | EndSessionMessage;
