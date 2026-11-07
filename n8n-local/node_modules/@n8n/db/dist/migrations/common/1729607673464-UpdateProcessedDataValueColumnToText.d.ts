import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class UpdateProcessedDataValueColumnToText1729607673464 implements ReversibleMigration {
    up({ schemaBuilder: { addNotNull }, runQuery, tablePrefix }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { addNotNull }, runQuery, tablePrefix }: MigrationContext): Promise<void>;
}
