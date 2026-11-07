import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class ChangeWorkflowPublishedVersionFKsToRestrict1772619247762 implements ReversibleMigration {
    up({ schemaBuilder: { dropForeignKey, addForeignKey } }: MigrationContext): Promise<void>;
    down({ schemaBuilder: { dropForeignKey, addForeignKey } }: MigrationContext): Promise<void>;
}
