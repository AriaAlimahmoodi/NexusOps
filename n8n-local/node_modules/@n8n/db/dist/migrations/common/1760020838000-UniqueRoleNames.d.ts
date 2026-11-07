import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class UniqueRoleNames1760020838000 implements ReversibleMigration {
    up({ escape, runQuery }: MigrationContext): Promise<void>;
    down({ escape, runQuery }: MigrationContext): Promise<void>;
}
