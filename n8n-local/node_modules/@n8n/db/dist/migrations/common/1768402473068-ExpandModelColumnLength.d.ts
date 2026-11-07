import type { ReversibleMigration, MigrationContext } from '../migration-types';
export declare class ExpandModelColumnLength1768402473068 implements ReversibleMigration {
    up({ isSqlite, isPostgres, escape, queryRunner }: MigrationContext): Promise<void>;
    down({ isSqlite, isPostgres, escape, queryRunner }: MigrationContext): Promise<void>;
}
