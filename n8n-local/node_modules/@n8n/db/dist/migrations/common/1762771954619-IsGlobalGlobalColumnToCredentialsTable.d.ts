import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddIsGlobalColumnToCredentialsTable1762771954619 implements ReversibleMigration {
    up({ escape, runQuery, isSqlite }: MigrationContext): Promise<void>;
    down({ escape, runQuery }: MigrationContext): Promise<void>;
}
