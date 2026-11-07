import type { ChatHubConversationModel, ChatHubProvider, ChatMessageId, ChatSessionId, ChatAttachment, ChatHubLLMProvider } from '@n8n/api-types';
import type { INodeCredentials, IRunExecutionData, IWorkflowBase } from 'n8n-workflow';
import { z } from 'zod';
export interface ModelWithCredentials {
    provider: ChatHubProvider;
    model?: string;
    workflowId?: string;
    credentialId: string | null;
    agentId?: string;
    name?: string;
}
export interface BaseMessagePayload {
    userId: string;
    sessionId: ChatSessionId;
    model: ChatHubConversationModel;
    credentials: INodeCredentials;
    timeZone?: string;
}
export interface HumanMessagePayload extends BaseMessagePayload {
    messageId: ChatMessageId;
    message: string;
    previousMessageId: ChatMessageId | null;
    attachments: ChatAttachment[];
    agentName?: string;
}
export interface RegenerateMessagePayload extends BaseMessagePayload {
    retryId: ChatMessageId;
}
export interface EditMessagePayload extends BaseMessagePayload {
    editId: ChatMessageId;
    messageId: ChatMessageId;
    message: string;
    newAttachments: ChatAttachment[];
    keepAttachmentIndices: number[];
}
export type ContentBlock = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: string;
};
export type MessageRole = 'ai' | 'system' | 'user';
export interface MessageRecord {
    type: MessageRole;
    message: string | ContentBlock[];
    hideFromUI: boolean;
}
declare const ChatTriggerResponseModeSchema: z.ZodEnum<["streaming", "lastNode", "responseNode", "responseNodes"]>;
export type ChatTriggerResponseMode = z.infer<typeof ChatTriggerResponseModeSchema>;
export type NonStreamingResponseMode = Exclude<ChatTriggerResponseMode, 'streaming' | 'responseNode'>;
export declare const chatTriggerParamsShape: z.ZodObject<{
    availableInChat: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    agentName: z.ZodOptional<z.ZodString>;
    agentDescription: z.ZodOptional<z.ZodString>;
    agentIcon: z.ZodOptional<z.ZodType<import("n8n-workflow").IconOrEmoji, z.ZodTypeDef, import("n8n-workflow").IconOrEmoji>>;
    suggestedPrompts: z.ZodOptional<z.ZodObject<{
        prompts: z.ZodOptional<z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            icon: z.ZodOptional<z.ZodType<import("n8n-workflow").IconOrEmoji, z.ZodTypeDef, import("n8n-workflow").IconOrEmoji>>;
        }, "strip", z.ZodTypeAny, {
            text: string;
            icon?: import("n8n-workflow").IconOrEmoji | undefined;
        }, {
            text: string;
            icon?: import("n8n-workflow").IconOrEmoji | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        prompts?: {
            text: string;
            icon?: import("n8n-workflow").IconOrEmoji | undefined;
        }[] | undefined;
    }, {
        prompts?: {
            text: string;
            icon?: import("n8n-workflow").IconOrEmoji | undefined;
        }[] | undefined;
    }>>;
    options: z.ZodOptional<z.ZodObject<{
        allowFileUploads: z.ZodOptional<z.ZodBoolean>;
        allowedFilesMimeTypes: z.ZodOptional<z.ZodString>;
        responseMode: z.ZodOptional<z.ZodEnum<["streaming", "lastNode", "responseNode", "responseNodes"]>>;
        autoSaveHighlightedData: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        allowFileUploads?: boolean | undefined;
        allowedFilesMimeTypes?: string | undefined;
        responseMode?: "lastNode" | "responseNode" | "responseNodes" | "streaming" | undefined;
        autoSaveHighlightedData?: boolean | undefined;
    }, {
        allowFileUploads?: boolean | undefined;
        allowedFilesMimeTypes?: string | undefined;
        responseMode?: "lastNode" | "responseNode" | "responseNodes" | "streaming" | undefined;
        autoSaveHighlightedData?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    availableInChat: boolean;
    agentName?: string | undefined;
    agentDescription?: string | undefined;
    agentIcon?: import("n8n-workflow").IconOrEmoji | undefined;
    suggestedPrompts?: {
        prompts?: {
            text: string;
            icon?: import("n8n-workflow").IconOrEmoji | undefined;
        }[] | undefined;
    } | undefined;
    options?: {
        allowFileUploads?: boolean | undefined;
        allowedFilesMimeTypes?: string | undefined;
        responseMode?: "lastNode" | "responseNode" | "responseNodes" | "streaming" | undefined;
        autoSaveHighlightedData?: boolean | undefined;
    } | undefined;
}, {
    availableInChat?: boolean | undefined;
    agentName?: string | undefined;
    agentDescription?: string | undefined;
    agentIcon?: import("n8n-workflow").IconOrEmoji | undefined;
    suggestedPrompts?: {
        prompts?: {
            text: string;
            icon?: import("n8n-workflow").IconOrEmoji | undefined;
        }[] | undefined;
    } | undefined;
    options?: {
        allowFileUploads?: boolean | undefined;
        allowedFilesMimeTypes?: string | undefined;
        responseMode?: "lastNode" | "responseNode" | "responseNodes" | "streaming" | undefined;
        autoSaveHighlightedData?: boolean | undefined;
    } | undefined;
}>;
export type ChatTriggerParams = z.infer<typeof chatTriggerParamsShape>;
export type PreparedChatWorkflow = {
    workflowData: IWorkflowBase;
    executionData: IRunExecutionData;
    responseMode: ChatTriggerResponseMode;
};
export interface SemanticSearchOptions {
    embeddingModel: {
        provider: ChatHubLLMProvider;
        credentialId: string;
    };
    vectorStore: {
        nodeType: string;
        credentialType: string;
        credentialId: string;
    };
}
export {};
