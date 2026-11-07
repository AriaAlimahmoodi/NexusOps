import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddScalingFieldsToTestRun1771417407753 implements ReversibleMigration {
    up({ escape, runQuery }: MigrationContext): Promise<void>;
    down({ escape, runQuery }: MigrationContext): Promise<void>;
}
