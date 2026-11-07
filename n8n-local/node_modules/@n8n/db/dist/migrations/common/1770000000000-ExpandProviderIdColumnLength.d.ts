import type { IrreversibleMigration, MigrationContext } from '../migration-types';
export declare class ExpandProviderIdColumnLength1770000000000 implements IrreversibleMigration {
    up({ isPostgres, escape, queryRunner }: MigrationContext): Promise<void>;
}
