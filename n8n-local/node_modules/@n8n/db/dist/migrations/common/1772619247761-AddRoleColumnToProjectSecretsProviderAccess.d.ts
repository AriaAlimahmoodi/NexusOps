import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddRoleColumnToProjectSecretsProviderAccess1772619247761 implements ReversibleMigration {
    up({ schemaBuilder: { addColumns, column } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns }, tablePrefix, queryRunner }: MigrationContext): Promise<void>;
}
