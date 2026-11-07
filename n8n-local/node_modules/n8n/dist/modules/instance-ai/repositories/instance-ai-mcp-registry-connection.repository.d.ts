import { DataSource, Repository } from '@n8n/typeorm';
import { InstanceAiMcpRegistryConnection } from '../entities/instance-ai-mcp-registry-connection.entity';
export declare class InstanceAiMcpRegistryConnectionRepository extends Repository<InstanceAiMcpRegistryConnection> {
    constructor(dataSource: DataSource);
}
