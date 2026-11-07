import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddProjectDescriptionColumn1747824239000 implements ReversibleMigration {
    up({ escape, runQuery }: MigrationContext): Promise<void>;
    down({ escape, runQuery }: MigrationContext): Promise<void>;
}
