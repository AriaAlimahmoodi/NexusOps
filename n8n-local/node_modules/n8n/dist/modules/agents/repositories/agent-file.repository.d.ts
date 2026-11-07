import { DataSource, Repository } from '@n8n/typeorm';
import { AgentFile } from '../entities/agent-file.entity';
export declare class AgentFileRepository extends Repository<AgentFile> {
    constructor(dataSource: DataSource);
    findByAgentId(agentId: string): Promise<AgentFile[]>;
    hasFilesForAgent(agentId: string): Promise<boolean>;
    findByIdAndAgentId(fileId: string, agentId: string): Promise<AgentFile | null>;
}
