import type { ChatHubConversationModel, ChatHubMessageStatus, ChatMessageId, ChatSessionId } from '@n8n/api-types';
import { BaseRepository, TransactionRunner, User } from '@n8n/db';
import { DataSource, EntityManager } from '@n8n/typeorm';
import { QueryDeepPartialEntity } from '@n8n/typeorm/query-builder/QueryPartialEntity';
import { type IBinaryData } from 'n8n-workflow';
import { ChatHubMessage } from './chat-hub-message.entity';
import { EditMessagePayload, HumanMessagePayload } from './chat-hub.types';
import { ChatHubSessionRepository } from './chat-session.repository';
export declare class ChatHubMessageRepository extends BaseRepository<ChatHubMessage> {
    private chatSessionRepository;
    constructor(dataSource: DataSource, chatSessionRepository: ChatHubSessionRepository, transactionRunner: TransactionRunner);
    createChatMessage(message: QueryDeepPartialEntity<ChatHubMessage>, trx?: EntityManager): Promise<void>;
    createHumanMessage(payload: HumanMessagePayload | EditMessagePayload, attachments: IBinaryData[], user: User, previousMessageId: ChatMessageId | null, model: ChatHubConversationModel, revisionOfMessageId?: ChatMessageId, trx?: EntityManager): Promise<void>;
    createAIMessage({ id, sessionId, executionId, previousMessageId, content, model, retryOfMessageId, status, }: {
        id: ChatMessageId;
        sessionId: ChatSessionId;
        previousMessageId: ChatMessageId | null;
        content: string;
        model: ChatHubConversationModel;
        executionId?: string;
        retryOfMessageId: ChatMessageId | null;
        editOfMessageId?: ChatMessageId;
        status?: ChatHubMessageStatus;
    }): Promise<void>;
    updateChatMessage(id: ChatMessageId, fields: {
        status?: ChatHubMessageStatus;
        content?: string;
        attachments?: IBinaryData[];
    }, trx?: EntityManager): Promise<import("@n8n/typeorm").UpdateResult>;
    deleteChatMessage(id: ChatMessageId, trx?: EntityManager): Promise<import("@n8n/typeorm").DeleteResult>;
    getManyBySessionId(sessionId: string, trx?: EntityManager): Promise<ChatHubMessage[]>;
    getOneById(id: ChatMessageId, sessionId: ChatSessionId, relations?: string[], trx?: EntityManager): Promise<ChatHubMessage | null>;
}
