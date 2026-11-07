import { DataSource, Repository } from '@n8n/typeorm';
import { McpRegistryServerEntity } from './mcp-registry-server.entity';
import type { McpRegistryServerUpsertRow } from './mcp-registry.types';
export declare class McpRegistryServerRepository extends Repository<McpRegistryServerEntity> {
    constructor(dataSource: DataSource);
    readDbNow(): Promise<Date>;
    upsertFetchedServers(rows: McpRegistryServerUpsertRow[], fetchedAt: Date): Promise<void>;
}
