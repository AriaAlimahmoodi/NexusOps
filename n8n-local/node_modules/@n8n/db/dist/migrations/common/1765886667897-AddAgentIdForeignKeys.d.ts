import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddAgentIdForeignKeys1765886667897 implements ReversibleMigration {
    up({ schemaBuilder: { addForeignKey }, runQuery, escape }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropForeignKey } }: MigrationContext): Promise<void>;
}
