import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddStoredAtToExecutionEntity1768557000000 implements ReversibleMigration {
    up({ escape, runQuery }: MigrationContext): Promise<void>;
    down({ escape, runQuery }: MigrationContext): Promise<void>;
}
