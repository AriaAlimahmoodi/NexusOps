import { type ISessionStorage, type StoredSession } from '@n8n/ai-workflow-builder';
import { DataSource, Repository } from '@n8n/typeorm';
import { WorkflowBuilderSession } from './workflow-builder-session.entity';
export declare class WorkflowBuilderSessionRepository extends Repository<WorkflowBuilderSession> implements ISessionStorage {
    constructor(dataSource: DataSource);
    getSession(threadId: string): Promise<StoredSession | null>;
    saveSession(threadId: string, data: StoredSession): Promise<void>;
    deleteSession(threadId: string): Promise<void>;
    private parseThreadId;
}
