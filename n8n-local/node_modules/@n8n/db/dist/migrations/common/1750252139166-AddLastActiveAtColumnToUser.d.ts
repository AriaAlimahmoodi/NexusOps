import type { MigrationContext, ReversibleMigration } from '../migration-types';
export declare class AddLastActiveAtColumnToUser1750252139166 implements ReversibleMigration {
    up({ escape, runQuery }: MigrationContext): Promise<void>;
    down({ escape, runQuery }: MigrationContext): Promise<void>;
}
