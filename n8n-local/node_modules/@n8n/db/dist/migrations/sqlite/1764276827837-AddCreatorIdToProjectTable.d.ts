import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddCreatorIdToProjectTable1764276827837 implements ReversibleMigration {
    withFKsDisabled: true;
    up({ escape, schemaBuilder: { addColumns, addForeignKey, column }, queryRunner, }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropColumns } }: MigrationContext): Promise<void>;
}
