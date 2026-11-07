import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class UniqueWorkflowNames1620821879465 implements ReversibleMigration {
    protected indexSuffix: string;
    up({ escape, runQuery }: MigrationContext): Promise<void>;
    down({ escape, runQuery }: MigrationContext): Promise<void>;
}
