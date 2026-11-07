import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddResolvableFieldsToCredentials1765459448000 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, addForeignKey, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns, dropForeignKey } }: MigrationContext): Promise<void>;
}
