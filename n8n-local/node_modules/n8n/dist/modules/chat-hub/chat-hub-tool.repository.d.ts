import { DataSource, EntityManager, Repository } from '@n8n/typeorm';
import { ChatHubTool, type IChatHubTool } from './chat-hub-tool.entity';
export declare class ChatHubToolRepository extends Repository<ChatHubTool> {
    constructor(dataSource: DataSource);
    createTool(tool: Partial<IChatHubTool> & Pick<IChatHubTool, 'id'>, trx?: EntityManager): Promise<ChatHubTool>;
    updateTool(id: string, updates: Partial<IChatHubTool>, trx?: EntityManager): Promise<ChatHubTool>;
    deleteTool(id: string, trx?: EntityManager): Promise<import("@n8n/typeorm").DeleteResult>;
    getManyByUserId(userId: string): Promise<ChatHubTool[]>;
    getEnabledByUserId(userId: string, trx?: EntityManager): Promise<ChatHubTool[]>;
    getOneById(id: string, userId: string, trx?: EntityManager): Promise<ChatHubTool | null>;
    getByIds(ids: string[], userId: string, trx?: EntityManager): Promise<ChatHubTool[]>;
    getToolsForSession(sessionId: string, trx?: EntityManager): Promise<ChatHubTool[]>;
    getToolsForAgent(agentId: string, trx?: EntityManager): Promise<ChatHubTool[]>;
    getToolIdsForSession(sessionId: string, trx?: EntityManager): Promise<string[]>;
    getToolIdsForAgent(agentId: string, trx?: EntityManager): Promise<string[]>;
    setSessionTools(sessionId: string, toolIds: string[], trx?: EntityManager): Promise<void>;
    setAgentTools(agentId: string, toolIds: string[], trx?: EntityManager): Promise<void>;
    private replaceLinkedTools;
}
