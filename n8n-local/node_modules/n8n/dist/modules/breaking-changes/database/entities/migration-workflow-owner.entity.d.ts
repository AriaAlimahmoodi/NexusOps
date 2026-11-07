import type { MigrationOwnerSource } from '@n8n/api-types';
import { WithTimestamps } from '@n8n/db';
import type { User, WorkflowEntity } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
export declare class MigrationWorkflowOwner extends WithTimestamps {
    workflowId: string;
    workflow: Relation<WorkflowEntity>;
    userId: string | null;
    user: Relation<User> | null;
    source: MigrationOwnerSource;
    assignedById: string | null;
    assignedBy: Relation<User> | null;
    assignedAt: Date | null;
}
