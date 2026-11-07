import { WithTimestamps } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import { AgentHistory } from './agent-history.entity';
export declare class AgentTaskSnapshot extends WithTimestamps {
    versionId: string;
    version: Relation<AgentHistory>;
    taskId: string;
    enabled: boolean;
    name: string;
    objective: string;
    cronExpression: string;
    timezone: string | null;
}
