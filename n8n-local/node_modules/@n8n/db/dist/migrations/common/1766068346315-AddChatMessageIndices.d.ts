import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddChatMessageIndices1766068346315 implements ReversibleMigration {
    up({ schemaBuilder: { addNotNull }, runQuery, escape }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropNotNull }, runQuery, escape }: MigrationContext): Promise<void>;
}
