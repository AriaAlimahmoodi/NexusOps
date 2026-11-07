import { WithTimestampsAndStringId, type ExecutionDataStorageLocation } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { Agent } from './agent.entity';
export declare class AgentFile extends WithTimestampsAndStringId {
    agent: Relation<Agent>;
    agentId: string;
    storedAt: ExecutionDataStorageLocation;
    storageKey: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
}
