import { BaseRepository, TransactionRunner, type OperationContext } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentTaskSnapshot } from '../entities/agent-task-snapshot.entity';
type AgentTaskSnapshotData = Pick<AgentTaskSnapshot, 'versionId' | 'taskId' | 'enabled' | 'name' | 'objective' | 'cronExpression' | 'timezone'>;
export declare class AgentTaskSnapshotRepository extends BaseRepository<AgentTaskSnapshot> {
    constructor(dataSource: DataSource, transactionRunner: TransactionRunner);
    saveForVersion(snapshots: AgentTaskSnapshotData[], ctx?: OperationContext): Promise<void>;
    findByVersionId(versionId: string, ctx?: OperationContext): Promise<AgentTaskSnapshot[]>;
    findEnabledByVersionId(versionId: string): Promise<AgentTaskSnapshot[]>;
    findByVersionAndTaskId(versionId: string, taskId: string): Promise<AgentTaskSnapshot | null>;
}
export {};
