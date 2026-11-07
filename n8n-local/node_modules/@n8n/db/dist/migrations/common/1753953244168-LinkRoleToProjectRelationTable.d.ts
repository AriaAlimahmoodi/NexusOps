import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class LinkRoleToProjectRelationTable1753953244168 implements ReversibleMigration {
    up({ schemaBuilder: { addForeignKey }, escape, dbType, runQuery }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropForeignKey } }: MigrationContext): Promise<void>;
}
