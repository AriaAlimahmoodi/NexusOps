import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddResolvableFieldsToCredentials1764689448000 implements ReversibleMigration {
    withFKsDisabled: true;
    up({ schemaBuilder: { addColumns, addForeignKey, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
