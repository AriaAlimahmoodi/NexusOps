import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddWorkflowPublishScopeToProjectRoles1766064542000 implements ReversibleMigration {
    up({ escape, runQuery, logger }: MigrationContext): Promise<void>;
    down({ escape, runQuery, logger }: MigrationContext): Promise<void>;
}
