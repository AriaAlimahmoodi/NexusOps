import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class LinkRoleToUserTable1750252139168 implements ReversibleMigration {
    up({ schemaBuilder: { addForeignKey, addColumns, column }, escape, dbType, runQuery, }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropForeignKey, dropColumns } }: MigrationContext): Promise<void>;
}
