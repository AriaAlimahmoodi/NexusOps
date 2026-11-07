import type { ChatHubCreateToolRequest, ChatHubUpdateToolRequest, ChatHubToolDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { EntityManager, type User } from '@n8n/db';
import type { INode } from 'n8n-workflow';
import { NodeTypes } from '../../node-types';
import { DeprecatedNodesValidationService } from '../../workflows/deprecated-nodes-validation.service';
import type { ChatHubTool } from './chat-hub-tool.entity';
import { ChatHubToolRepository } from './chat-hub-tool.repository';
export declare class ChatHubToolService {
    private readonly logger;
    private readonly chatToolRepository;
    private readonly nodeTypes;
    private readonly deprecatedNodesValidationService;
    constructor(logger: Logger, chatToolRepository: ChatHubToolRepository, nodeTypes: NodeTypes, deprecatedNodesValidationService: DeprecatedNodesValidationService);
    getToolsByUserId(userId: string): Promise<ChatHubTool[]>;
    getEnabledTools(userId: string, trx?: EntityManager): Promise<ChatHubTool[]>;
    getToolDefinitionsForSession(sessionId: string, trx?: EntityManager): Promise<INode[]>;
    getToolDefinitionsForAgent(agentId: string, trx?: EntityManager): Promise<INode[]>;
    getToolIdsForSession(sessionId: string, trx?: EntityManager): Promise<string[]>;
    getToolIdsForAgent(agentId: string, trx?: EntityManager): Promise<string[]>;
    setSessionTools(sessionId: string, ownerId: string, toolIds: string[], trx?: EntityManager): Promise<void>;
    setAgentTools(agentId: string, ownerId: string, toolIds: string[], trx?: EntityManager): Promise<void>;
    private ensureToolsOwnedBy;
    private validateToolExpressions;
    createTool(user: User, data: ChatHubCreateToolRequest): Promise<ChatHubTool>;
    updateTool(id: string, user: User, updates: ChatHubUpdateToolRequest, trx?: EntityManager): Promise<ChatHubTool>;
    deleteTool(id: string, userId: string, trx?: EntityManager): Promise<void>;
    static toDto(tool: ChatHubTool): ChatHubToolDto;
}
