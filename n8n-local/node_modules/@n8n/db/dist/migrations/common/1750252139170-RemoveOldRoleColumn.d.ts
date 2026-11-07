import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class RemoveOldRoleColumn1750252139170 implements ReversibleMigration {
    up({ schemaBuilder: { dropColumns }, escape, runQuery }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { addColumns, column }, escape, runQuery }: MigrationContext): Promise<void>;
}
